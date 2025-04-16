from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from api.views import UserAccountViewSet, UserRoleViewSet
from api.views import StockViewSet
from api.views import CategoryViewSet
from api.views import TransItemDetailViewSet, TransactionHistoryViewSet
from api.views import SupplierViewSet

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'users', UserAccountViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')
router.register(r'stock', StockViewSet, basename='stock')
#/low_stock, /update_margin

router.register(r'categories', CategoryViewSet, basename='category')

router.register(r'transactions', TransactionHistoryViewSet, basename='transaction')
router.register(r'trans-items', TransItemDetailViewSet, basename='transitem')
router.register(r'suppliers', SupplierViewSet, basename='supplier')


urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    path('', include(router.urls)),

    # OpenAPI schema
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger UI
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # Redoc
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
