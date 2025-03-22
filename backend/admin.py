from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

UserAccount = get_user_model()

@admin.register(UserAccount)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    ordering = ('username',)

    fieldsets = (
        *UserAdmin.fieldsets,
        ('Custom Fields', {'fields': ('role',)}),
    )

    add_fieldsets = (
        *UserAdmin.add_fieldsets,
        ('Custom Fields', {'fields': ('role',)}),
    )
