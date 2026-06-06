from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('sfauth.urls')),
    path('api/', include('rules.urls')),
]
