from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import CustomUser, UserRole, Page, UserPageAccess

User = get_user_model()

# ================== UserRole Serializer ==================
class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = '__all__'

# ================== Page Serializer ==================
class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = '__all__'

class UserPageAccessNestedSerializer(serializers.ModelSerializer):
    page = serializers.CharField(source='page.name') 
    path = serializers.CharField(source='page.path') # page is FK, get its name

    class Meta:
        model = UserPageAccess  # or your model name
        fields = ['id', 'page','path']

# ================== User Serializer (With Role) ==================
class UserSerializer(serializers.ModelSerializer):
    pageaccess = UserPageAccessNestedSerializer(many=True, read_only=True, source='userpageaccess_set')

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'pageaccess','profile_image','date_of_birth','gender','organization']


# ================== Create User Serializer ==================
class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id','username', 'email', 'password', 'role','date_of_birth', 'gender', 'organization', 'profile_image']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user

# ================== UserPageAccess Serializer ==================
class UserPageAccessSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    page = PageSerializer()

    class Meta:
        model = UserPageAccess
        fields = '__all__'

# ================== Token Serializer with Role Validation ==================
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    role = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        requested_role = attrs.get("role")

        if not requested_role:
            raise serializers.ValidationError({"role": "Role is required."})

        # ✅ Authenticate using role-based backend
        user = authenticate(username=username, password=password)

        if user is None or str(user.role) != requested_role:
            raise serializers.ValidationError({"detail": "Invalid username, password, or role."})

        refresh = self.get_token(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': str(user.role),
            'username': user.username,
            'email': user.email
        }

# ================== Update User Serializer ==================
class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'role', 'date_of_birth', 'gender', 'organization', 'profile_image']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance
