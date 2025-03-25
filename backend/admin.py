from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from api.models import UserAccount, UserRole

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


class UserAccountAdmin(admin.ModelAdmin):
    list_display = ('username', 'role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'role__name')

admin.site.register(UserAccount, UserAccountAdmin)
admin.site.register(UserRole)
