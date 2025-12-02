from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/groups/', views.get_groups, name='get_groups'),
    path('api/students/', views.get_students, name='get_students'),
    path('api/students/create/', views.create_student, name='create_student'),
    path('api/students/<int:student_id>/', views.get_student_detail, name='student_detail'),
]