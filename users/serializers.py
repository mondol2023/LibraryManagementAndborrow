from datetime import datetime, date

from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password

from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=[
        ("admin", "Admin"),
        ("student", "Student"),
        ("teacher", "Teacher"),
        ("staff", "Staff"),
        ("other", "Other"),
    ], default='other')

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
        role = validated_data.get('role', 'other')
        request = self.context.get('request')

        if not request.user.is_authenticated:
            user = User.objects.create_user(
                **validated_data
            )

            if role in ['admin', 'staff']:
                user.is_active = False
            else:
                user.is_active = True
            
            user.save()
            return user
        
        else:
            raise serializers.ValidationError({"user": "User already exists."})
        
class PenaltySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'penalty_points']
