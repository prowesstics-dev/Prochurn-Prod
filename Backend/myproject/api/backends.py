from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
import logging
logger = logging.getLogger(__name__)
User = get_user_model()

class RoleAuthenticationBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, role=None, **kwargs):
        logger.info(f"Authenticating user: {username} with role: {role}")
        try:
            user = User.objects.get(username=username)
            logger.info(f"User found. DB role: {user.role}")
            if user.check_password(password) and str(user.role).lower() == str(role).lower():
                logger.info("Role matches. Authentication successful.")
                return user
            else:
                logger.info("Role mismatch. Authentication failed.")
        except User.DoesNotExist:
            logger.info("User not found.")
        return None
