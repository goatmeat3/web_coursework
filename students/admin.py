from django.contrib import admin
from .models import Faculties, Specialties, Groups, Students, Grades

@admin.register(Faculties)
class FacultiesAdmin(admin.ModelAdmin):
    list_display = ['faculty_name', 'faculty_type']
    search_fields = ['faculty_name']

@admin.register(Specialties)
class SpecialtiesAdmin(admin.ModelAdmin):
    list_display = ['specialty_name', 'faculty']
    list_filter = ['faculty']
    search_fields = ['specialty_name']

@admin.register(Groups)
class GroupsAdmin(admin.ModelAdmin):
    list_display = ['group_name', 'specialty']
    list_filter = ['specialty']
    search_fields = ['group_name']

@admin.register(Students)
class StudentsAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'patronymic', 'group', 'year_of_admission']
    list_filter = ['group', 'year_of_admission']
    search_fields = ['last_name', 'first_name', 'patronymic']

@admin.register(Grades)
class GradesAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'grade']
    list_filter = ['subject', 'grade']
    search_fields = ['student__last_name', 'student__first_name', 'subject']