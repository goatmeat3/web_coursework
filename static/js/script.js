// static/js/script.js

// Делаем функцию viewStudent глобальной, чтобы она была доступна из HTML
async function viewStudent(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}/`);
        const student = await response.json();

        if (response.ok) {
            // Формируем модальное окно с информацией о студенте
            const modalHtml = `
                <div class="modal fade" id="studentModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Карточка студента: ${student.last_name} ${student.first_name}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Личная информация:</h6>
                                        <p><strong>ФИО:</strong> ${student.last_name} ${student.first_name} ${student.patronymic || ''}</p>
                                        <p><strong>Дата рождения:</strong> ${student.date_of_birth || 'не указана'}</p>
                                        <p><strong>Гражданство:</strong> ${student.citizenship || 'не указано'}</p>
                                        <p><strong>Телефон:</strong> ${student.phone_number || 'не указан'}</p>
                                        <p><strong>Email:</strong> ${student.email || 'не указан'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Учебная информация:</h6>
                                        <p><strong>Группа:</strong> ${student.group_name}</p>
                                        <p><strong>Год поступления:</strong> ${student.year_of_admission}</p>
                                        <p><strong>ID студента:</strong> ${student.student_id}</p>
                                    </div>
                                </div>

                                <h6 class="mt-3">Дисциплины и оценки:</h6>
                                ${student.grades && student.grades.length > 0 ?
                                    `<ul class="list-group">
                                        ${student.grades.map(grade =>
                                            `<li class="list-group-item d-flex justify-content-between align-items-center">
                                                ${grade.subject}
                                                <span class="badge bg-primary rounded-pill">${grade.grade}</span>
                                            </li>`
                                        ).join('')}
                                    </ul>` :
                                    '<p>Нет данных об оценках</p>'
                                }
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Добавляем модальное окно в DOM и показываем его
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = new bootstrap.Modal(document.getElementById('studentModal'));
            modal.show();

            // Удаляем модальное окно после закрытия
            document.getElementById('studentModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
        } else {
            alert('Ошибка загрузки данных студента: ' + student.error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при загрузке данных студента');
    }
}

// Функция для получения CSRF токена
function getCSRFToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

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
    // 2. Загружаем таблицу студентов
    loadStudentsTable();

    // 3. Обработчик для кнопки "Добавить дисциплину"
    addSubjectBtn.addEventListener('click', addSubjectField);

    // 4. Валидация полей Имя/Фамилия в реальном времени
    document.getElementById('lastName').addEventListener('input', validateNameField);
    document.getElementById('firstName').addEventListener('input', validateNameField);

    // 5. Обработчик отправки формы
    studentForm.addEventListener('submit', handleFormSubmit);

    // ===== ФУНКЦИИ =====

    // Загрузка групп из API Django
    async function loadGroups() {
        try {
            const response = await fetch('/api/groups/');
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
            <input type="text" class="form-control" name="subjects" placeholder="Название дисциплины" required>
            <input type="text" class="form-control" name="grades" placeholder="Оценка (5, Зачет и т.д.)" required>
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
        const russianRegex = /^[А-Яа-яЁё\s\-]*$/;

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

        // Собираем массивы дисциплин и оценок
        const subjectInputs = subjectsContainer.querySelectorAll('input[name="subjects"]');
        const gradeInputs = subjectsContainer.querySelectorAll('input[name="grades"]');

        const subjects = [];
        const grades = [];

        subjectInputs.forEach((input, index) => {
            if (input.value.trim() && gradeInputs[index].value.trim()) {
                subjects.push(input.value.trim());
                grades.push(gradeInputs[index].value.trim());
            }
        });

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
            subjects: subjects,
            grades: grades
        };

        try {
            // Отправляем данные на сервер Django с CSRF токеном
            const response = await fetch('/api/students/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
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
                loadStudentsTable(); // Обновляем таблицу студентов
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
            const response = await fetch('/api/students/');
            const students = await response.json();

            if (students.error) {
                console.error('Ошибка сервера:', students.error);
                return;
            }

            // Очищаем таблицу
            const tbody = studentsTable.querySelector('tbody');
            tbody.innerHTML = '';

            // Если есть студенты - заполняем таблицу
            if (students.length > 0) {
                students.forEach(student => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${student.full_name}</td>
                        <td>${student.group_name}</td>
                        <td>${student.specialty_name}</td>
                        <td>${student.year_of_admission}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewStudent(${student.student_id})">
                                Просмотр
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Показываем таблицу
                studentsTableCard.style.display = 'block';
            } else {
                studentsTableCard.style.display = 'none';
            }
        } catch (error) {
            console.error('Ошибка загрузки студентов:', error);
            studentsTableCard.style.display = 'none';
        }
    }

    // Добавляем первую пару полей для дисциплины при загрузке
    addSubjectField();
});