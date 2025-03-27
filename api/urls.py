from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from api.views import UserAccountViewSet, UserRoleViewSet
from api.views import StockViewSet
from api.views import CategoryViewSet

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'stock', StockViewSet, basename='stock')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'users', UserAccountViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')


urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    path('', include(router.urls)),
    #/low_stock, /update_margin
]
