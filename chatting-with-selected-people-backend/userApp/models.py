from typing import Any
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import UserManager,AbstractBaseUser,PermissionsMixin
# Create your models here.
class CustomUserManager(UserManager):
    def _create_user(self,email,password,enrollmentNo,**extra_fields):
        if not email:
            return ValueError("If have not provided a valid email ID!")
        email = self.normalize_email(email)
        user = self.model(email=email,enrollmentNo= enrollmentNo,**extra_fields)
        user.set_password(password)
        user.save(using = self._db)
        return user
    def create_user(self,email=None,password=None,enrollmentNo = None,**extra_fields):
        extra_fields.setdefault('is_staff',False)
        extra_fields.setdefault('is_superuser',False)
        return self._create_user(email=email,password=password,enrollmentNo = enrollmentNo,**extra_fields)
    
    def create_superuser(self,email=None,password=None,enrollmentNo=None,**extra_fields):
        extra_fields.setdefault('is_staff',True)
        extra_fields.setdefault('is_superuser',True)
        return self._create_user(email=email,password=password,enrollmentNo = enrollmentNo,**extra_fields)
    

class User(AbstractBaseUser,PermissionsMixin):
    email = models.EmailField(blank=True,unique = True,default='')
    name =  models.CharField(max_length=255,blank = True,default='')
    enrollmentNo = models.BigIntegerField(unique=True,blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_authorized = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = []
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def get_full_name(self):
        return self.name










    