# app.py
from flask import Flask, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor
import os
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


# Простой тестовый маршрут для проверки работы сервера
@app.route('/')
def hello():
    return jsonify({"message": "Сервер студенческих карточек работает!"})


# Маршрут для получения всех студентов (пока тестовый)
@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)  # Чтобы получить результаты в виде словаря

        # Пока простой запрос, потом усложним
        cur.execute('SELECT student_id, last_name, first_name FROM Students LIMIT 5;')
        students = cur.fetchall()

        cur.close()
        conn.close()
        return jsonify(students)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)  # debug=True для режима отладки