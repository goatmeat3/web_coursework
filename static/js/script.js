// static/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const studentForm = document.getElementById('studentForm');
    const groupSelect = document.getElementById('group');
    const subjectsContainer = document.getElementById('subjectsContainer');
    const addSubjectBtn = document.getElementById('addSubject');
    const studentsTableCard = document.getElementById('studentsTableCard');
    const studentsTable = document.getElementById('studentsTable');

    let subjectCount = 0;

    // 1. Загружаем группы при загрузке страницы
    loadGroups();

    // 2. Обработчик для кнопки "Добавить дисциплину"
    addSubjectBtn.addEventListener('click', addSubjectField);

    // 3. Валидация полей Имя/Фамилия в реальном времени
    document.getElementById('lastName').addEventListener('input', validateNameField);
    document.getElementById('firstName').addEventListener('input', validateNameField);

    // 4. Обработчик отправки формы
    studentForm.addEventListener('submit', handleFormSubmit);

    // ===== ФУНКЦИИ =====

    // Загрузка групп из API
    async function loadGroups() {
        try {
            const response = await fetch('/api/groups');
            const groups = await response.json();

            // Очищаем селект и добавляем группы
            groupSelect.innerHTML = '<option value="">Выберите группу...</option>';
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.group_id;
                option.textContent = `${group.group_name} (${group.specialty_name})`;
                groupSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка загрузки групп:', error);
        }
    }

    // Добавление полей для новой дисциплины
    function addSubjectField() {
        subjectCount++;
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-row';
        subjectDiv.innerHTML = `
            <input type="text" class="form-control" name="subjects[]" placeholder="Название дисциплины" required>
            <input type="text" class="form-control" name="grades[]" placeholder="Оценка (5, Зачет и т.д.)" required>
            <button type="button" class="btn btn-outline-danger remove-subject" onclick="this.parentElement.remove()">
                ×
            </button>
        `;
        subjectsContainer.appendChild(subjectDiv);
    }

    // Валидация полей Имя/Фамилия
    function validateNameField(event) {
        const field = event.target;
        const value = field.value.trim();
        const russianRegex = /^[А-Яа-яЁё\s\-]*$/; // Только русские буквы, пробелы и дефисы

        if (value.length > 20) {
            field.classList.add('is-invalid');
            field.nextElementSibling.textContent = 'Максимальная длина 20 символов';
        } else if (value && !russianRegex.test(value)) {
            field.classList.add('is-invalid');
            field.nextElementSibling.textContent = 'Только русские символы';
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    }

    // Обработчик отправки формы
    async function handleFormSubmit(event) {
        event.preventDefault();

        // Проверяем валидацию перед отправкой
        if (!validateForm()) {
            alert('Пожалуйста, исправьте ошибки в форме');
            return;
        }

        // Собираем данные формы
        const formData = new FormData(studentForm);
        const studentData = {
            last_name: formData.get('last_name'),
            first_name: formData.get('first_name'),
            patronymic: formData.get('patronymic') || null,
            date_of_birth: formData.get('date_of_birth') || null,
            citizenship: formData.get('citizenship') || null,
            phone_number: formData.get('phone_number') || null,
            email: formData.get('email') || null,
            year_of_admission: parseInt(formData.get('year_of_admission')),
            group_id: parseInt(formData.get('group_id')),
            subjects: formData.getAll('subjects[]'),
            grades: formData.getAll('grades[]')
        };

        try {
            // Отправляем данные на сервер
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
            });

            const result = await response.json();

            if (response.ok) {
                // Успешное сохранение
                alert('Студент успешно сохранен!');
                studentForm.reset();
                subjectsContainer.innerHTML = ''; // Очищаем дисциплины
                subjectCount = 0;
                loadStudentsTable(); // Показываем таблицу студентов
            } else {
                // Ошибка валидации на сервере
                alert('Ошибка: ' + result.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при сохранении');
        }
    }

    // Валидация всей формы перед отправкой
    function validateForm() {
        const lastName = document.getElementById('lastName');
        const firstName = document.getElementById('firstName');
        const group = document.getElementById('group');

        // Проверяем обязательные поля
        if (!lastName.value.trim() || !firstName.value.trim() || !group.value) {
            alert('Заполните обязательные поля (Фамилия, Имя, Группа)');
            return false;
        }

        // Проверяем валидацию имен
        if (lastName.classList.contains('is-invalid') || firstName.classList.contains('is-invalid')) {
            return false;
        }

        return true;
    }

    // Загрузка и отображение таблицы студентов
    async function loadStudentsTable() {
        try {
            const response = await fetch('/api/students');
            const students = await response.json();

            // Очищаем таблицу
            studentsTable.querySelector('tbody').innerHTML = '';

            // Заполняем таблицу
            students.forEach(student => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.full_name}</td>
                    <td>${student.group_name}</td>
                    <td>${student.specialty_name}</td>
                    <td>${student.year_of_admission}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary">Просмотр</button>
                    </td>
                `;
                studentsTable.querySelector('tbody').appendChild(row);
            });

            // Показываем таблицу
            studentsTableCard.style.display = 'block';
        } catch (error) {
            console.error('Ошибка загрузки студентов:', error);
        }
    }

    // Добавляем первую пару полей для дисциплины при загрузке
    addSubjectField();
});