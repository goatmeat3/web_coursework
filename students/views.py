from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import json
import re
from .models import Students, Groups, Specialties, Faculties, Grades


# Главная страница
def index(request):
    return render(request, 'index.html')


# API: получить все группы
@csrf_exempt
def get_groups(request):
    groups = Groups.objects.select_related('specialty').all()
    data = [
        {
            'group_id': group.group_id,
            'group_name': group.group_name,
            'specialty_name': group.specialty.specialty_name
        }
        for group in groups
    ]
    return JsonResponse(data, safe=False)


# API: получить всех студентов
@csrf_exempt
def get_students(request):
    students = Students.objects.select_related('group__specialty').all()
    data = [
        {
            'student_id': student.student_id,
            'full_name': f"{student.last_name} {student.first_name} {student.patronymic or ''}".strip(),
            'group_name': student.group.group_name,
            'specialty_name': student.group.specialty.specialty_name,
            'year_of_admission': student.year_of_admission
        }
        for student in students
    ]
    return JsonResponse(data, safe=False)


# Валидация имени
def validate_name(name):
    if not name or len(name) > 20:
        return False
    russian_pattern = re.compile('^[А-Яа-яЁё\\s\\-]+$')
    return bool(russian_pattern.match(name))


# API: создать студента
@csrf_exempt
def create_student(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # Валидация обязательных полей
            if not data.get('last_name') or not data.get('first_name') or not data.get('group_id'):
                return JsonResponse({"error": "Заполните обязательные поля: Фамилия, Имя, Группа"}, status=400)

            # Валидация имени и фамилии
            if not validate_name(data['last_name']):
                return JsonResponse({"error": "Фамилия должна содержать только русские символы (макс. 20)"}, status=400)

            if not validate_name(data['first_name']):
                return JsonResponse({"error": "Имя должно содержать только русские символы (макс. 20)"}, status=400)

            # Создание студента
            student = Students.objects.create(
                last_name=data['last_name'],
                first_name=data['first_name'],
                patronymic=data.get('patronymic'),
                date_of_birth=data.get('date_of_birth'),
                citizenship=data.get('citizenship'),
                phone_number=data.get('phone_number'),
                email=data.get('email'),
                year_of_admission=data.get('year_of_admission', 2023),
                group_id=data.get('group_id')
            )

            # Создание оценок
            subjects = data.get('subjects', [])
            grades = data.get('grades', [])

            for subject, grade in zip(subjects, grades):
                if subject and grade:
                    Grades.objects.create(
                        student=student,
                        subject=subject,
                        grade=grade
                    )

            return JsonResponse({
                "success": True,
                "student_id": student.student_id,
                "message": "Студент успешно добавлен"
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Метод не разрешен"}, status=405)


# API: получить данные одного студента (для расширения)
@csrf_exempt
def get_student_detail(request, student_id):
    try:
        student = Students.objects.get(student_id=student_id)
        grades = Grades.objects.filter(student=student)

        data = {
            'student_id': student.student_id,
            'last_name': student.last_name,
            'first_name': student.first_name,
            'patronymic': student.patronymic,
            'group_name': student.group.group_name,
            'grades': [{'subject': g.subject, 'grade': g.grade} for g in grades]
        }
        return JsonResponse(data)
    except Students.DoesNotExist:
        return JsonResponse({"error": "Студент не найден"}, status=404)