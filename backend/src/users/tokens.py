"""Access tokens that carry identity.

The default `TokenObtainPairSerializer` puts only `user_id` in the payload, so a
client would need an extra `/me` round trip on every page load just to learn who
is signed in and what they may do. Adding the claims here keeps that knowledge in
the token the client already holds.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

#: Claims copied from the user onto the token. One list, used for both the
#: token payload and the login response body.
IDENTITY_CLAIMS = ('username', 'email', 'role', 'first_name', 'last_name')


class IdentityTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        for claim in IDENTITY_CLAIMS:
            token[claim] = getattr(user, claim, None)
        return token


class LoginView(TokenObtainPairView):
    serializer_class = IdentityTokenObtainPairSerializer
