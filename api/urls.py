from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import StockViewSet

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'stock', StockViewSet, basename='stock')


urlpatterns = [
    path('', include(router.urls)),
    #/low_stock, /update_margin
]
