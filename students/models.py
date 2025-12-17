from django.db import models

class Faculties(models.Model):
    faculty_id = models.AutoField(primary_key=True)
    faculty_name = models.CharField(max_length=100)
    faculty_type = models.CharField(max_length=50)

    class Meta:
        db_table = 'faculties'
        verbose_name = 'Факультет'
        verbose_name_plural = 'Факультеты'

    def __str__(self):
        return self.faculty_name


class Specialties(models.Model):
    specialty_id = models.AutoField(primary_key=True)
    specialty_name = models.CharField(max_length=100)
    faculty = models.ForeignKey(Faculties, on_delete=models.CASCADE, db_column='faculty_id')

    class Meta:
        db_table = 'specialties'
        verbose_name = 'Специальность'
        verbose_name_plural = 'Специальности'

    def __str__(self):
        return self.specialty_name


class Groups(models.Model):
    group_id = models.AutoField(primary_key=True)
    group_name = models.CharField(max_length=20)
    specialty = models.ForeignKey(Specialties, on_delete=models.CASCADE, db_column='specialty_id')

    class Meta:
        db_table = 'groups'
        verbose_name = 'Группа'
        verbose_name_plural = 'Группы'

    def __str__(self):
        return self.group_name


class Students(models.Model):
    student_id = models.AutoField(primary_key=True)
    last_name = models.CharField(max_length=50, verbose_name='Фамилия')
    first_name = models.CharField(max_length=50, verbose_name='Имя')
    patronymic = models.CharField(max_length=50, blank=True, null=True, verbose_name='Отчество')
    date_of_birth = models.DateField(blank=True, null=True, verbose_name='Дата рождения')
    citizenship = models.CharField(max_length=50, blank=True, null=True, verbose_name='Гражданство')
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    year_of_admission = models.IntegerField(verbose_name='Год поступления')
    group = models.ForeignKey(Groups, on_delete=models.CASCADE, db_column='group_id', verbose_name='Группа')

    class Meta:
        db_table = 'students'
        verbose_name = 'Студент'
        verbose_name_plural = 'Студенты'

    def __str__(self):
        return f"{self.last_name} {self.first_name}"


class Grades(models.Model):
    grade_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Students, on_delete=models.CASCADE, db_column='student_id', verbose_name='Студент')
    subject = models.CharField(max_length=100, verbose_name='Дисциплина')
    grade = models.CharField(max_length=10, verbose_name='Оценка')

    class Meta:
        db_table = 'grades'
        verbose_name = 'Оценка'
        verbose_name_plural = 'Оценки'

    def __str__(self):
        return f"{self.subject}: {self.grade}"