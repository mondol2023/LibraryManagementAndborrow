from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password

from django.contrib.auth import get_user_model

User = get_user_model()

#: Fields a user is allowed to change about themselves. Anything that grants
#: privilege (role, is_active, penalty_points) is deliberately absent.
SELF_EDITABLE_FIELDS = ('first_name', 'last_name', 'email', 'phone_number')

#: Everything an admin may change on top of that.
ADMIN_EDITABLE_FIELDS = SELF_EDITABLE_FIELDS + (
    'role', 'is_active', 'penalty_points', 'reference_number', 'username',
)


def sync_privilege_flags(user):
    """Keep Django's own flags in step with the application role.

    The `admin` role is meant to control everything, which includes the Django
    admin site -- and that site checks `is_staff`/`is_superuser`, not `role`.
    """
    is_app_admin = user.role == User.ROLE_ADMIN
    user.is_staff = is_app_admin
    user.is_superuser = is_app_admin
    return user


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default=User.ROLE_OTHER)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'phone_number', 'reference_number', 'first_name', \
                  'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        attrs.pop('password2')
        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', User.ROLE_OTHER)
        request = self.context.get('request')

        is_authenticated = bool(request and request.user.is_authenticated)
        is_admin_request = is_authenticated and getattr(request.user, 'role', None) == User.ROLE_ADMIN

        if is_authenticated and not is_admin_request:
            raise serializers.ValidationError({"user": "You are already logged in."})

        user = User.objects.create_user(**validated_data)

        # Admin/staff self-signups wait for approval; accounts an admin creates are active at once.
        user.is_active = is_admin_request or role not in [User.ROLE_ADMIN, User.ROLE_STAFF]

        sync_privilege_flags(user)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Read shape for the user management endpoints."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'reference_number', 'role', 'penalty_points',
            'is_active', 'date_joined', 'last_login',
        )
        read_only_fields = fields

    def get_full_name(self, user):
        return user.get_full_name() or user.username


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Admin edit: role, activation and penalties included."""

    class Meta:
        model = User
        fields = ADMIN_EDITABLE_FIELDS
        extra_kwargs = {
            'username': {'validators': [UniqueValidator(queryset=User.objects.all())]},
            'email': {'validators': [UniqueValidator(queryset=User.objects.all())]},
            'penalty_points': {'min_value': 0},
        }

    def update(self, instance, validated_data):
        user = super().update(instance, validated_data)
        # A role change has to move the Django flags with it, in both directions.
        sync_privilege_flags(user)
        user.save(update_fields=['is_staff', 'is_superuser'])
        return user


class UserSelfUpdateSerializer(serializers.ModelSerializer):
    """What a user may change about their own account."""

    class Meta:
        model = User
        fields = SELF_EDITABLE_FIELDS
        extra_kwargs = {
            'email': {'validators': [UniqueValidator(queryset=User.objects.all())]},
        }


class PenaltySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'penalty_points']


class PenaltyAdjustSerializer(serializers.Serializer):
    """Set penalty points outright, or move them by a delta.

    `POST {"penalty_points": 0}` clears a fine; `POST {"delta": -2}` waives two.
    """

    penalty_points = serializers.IntegerField(required=False, min_value=0)
    delta = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if 'penalty_points' not in attrs and 'delta' not in attrs:
            raise serializers.ValidationError(
                {"penalty_points": "Provide either `penalty_points` or `delta`."}
            )
        if 'penalty_points' in attrs and 'delta' in attrs:
            raise serializers.ValidationError(
                {"penalty_points": "Provide only one of `penalty_points` or `delta`."}
            )
        return attrs

    def apply(self, user):
        if 'penalty_points' in self.validated_data:
            user.penalty_points = self.validated_data['penalty_points']
        else:
            # Never let a waiver push the balance below zero.
            user.penalty_points = max(0, user.penalty_points + self.validated_data['delta'])

        user.save(update_fields=['penalty_points'])
        return user
