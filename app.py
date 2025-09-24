# app.py
from flask import Flask, jsonify, request, render_template
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import re
from dotenv import load_dotenv

# Загружаем переменные окружения из файла .env (его создадим позже)
load_dotenv()

app = Flask(__name__)

# Функция для подключения к базе данных
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )
    return conn

# Главная страница с HTML
@app.route('/')
def index():
    return render_template('index.html')

# API: Получить все группы для выпадающего списка
@app.route('/api/groups', methods=['GET'])
def get_groups():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute('''
            SELECT g.group_id, g.group_name, s.specialty_name 
            FROM Groups g
            JOIN Specialties s ON g.specialty_id = s.specialty_id
            ORDER BY g.group_name
        ''')
        groups = cur.fetchall()

        cur.close()
        conn.close()
        return jsonify(groups)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API: Получить всех студентов для таблицы
@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute('''
            SELECT 
                s.student_id,
                s.last_name || ' ' || s.first_name || ' ' || COALESCE(s.patronymic, '') as full_name,
                g.group_name,
                spec.specialty_name,
                s.year_of_admission
            FROM Students s
            JOIN Groups g ON s.group_id = g.group_id
            JOIN Specialties spec ON g.specialty_id = spec.specialty_id
            ORDER BY s.last_name, s.first_name
        ''')
        students = cur.fetchall()

        cur.close()
        conn.close()
        return jsonify(students)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Валидация имени и фамилии
def validate_name(name):
    """Проверяет, что строка содержит только русские буквы и не длиннее 20 символов"""
    if not name or len(name) > 20:
        return False
    russian_pattern = re.compile('^[А-Яа-яЁё\\s\\-]+$')
    return bool(russian_pattern.match(name))


# API: Создать нового студента
@app.route('/api/students', methods=['POST'])
def create_student():
    try:
        data = request.get_json()

        # Валидация обязательных полей
        if not data.get('last_name') or not data.get('first_name') or not data.get('group_id'):
            return jsonify({"error": "Заполните обязательные поля: Фамилия, Имя, Группа"}), 400

        # Валидация имени и фамилии
        if not validate_name(data['last_name']):
            return jsonify({"error": "Фамилия должна содержать только русские символы (макс. 20)"}), 400

        if not validate_name(data['first_name']):
            return jsonify({"error": "Имя должно содержать только русские символы (макс. 20)"}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Вставляем студента
        cur.execute('''
            INSERT INTO Students (last_name, first_name, patronymic, date_of_birth, 
                                citizenship, phone_number, email, year_of_admission, group_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING student_id
        ''', (
            data['last_name'], data['first_name'], data.get('patronymic'),
            data.get('date_of_birth'), data.get('citizenship'), data.get('phone_number'),
            data.get('email'), data.get('year_of_admission'), data.get('group_id')
        ))

        student_id = cur.fetchone()['student_id']

        # Вставляем оценки (если есть)
        subjects = data.get('subjects', [])
        grades = data.get('grades', [])

        for subject, grade in zip(subjects, grades):
            if subject and grade:  # Проверяем, что поля не пустые
                cur.execute('''
                    INSERT INTO Grades (student_id, subject, grade)
                    VALUES (%s, %s, %s)
                ''', (student_id, subject, grade))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "student_id": student_id})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)