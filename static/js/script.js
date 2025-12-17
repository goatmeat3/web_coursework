// script.js
// Делаем функции глобальными
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
                                <button type="button" class="btn btn-outline-primary" onclick="editStudent(${student.student_id})">
                                    <i class="bi bi-pencil"></i> Редактировать
                                </button>
                                <button type="button" class="btn btn-outline-danger" onclick="showDeleteConfirmation(${student.student_id}, '${student.last_name} ${student.first_name}')">
                                    <i class="bi bi-trash"></i> Удалить
                                </button>
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

// Функция для подтверждения удаления
window.showDeleteConfirmation = function(studentId, studentName) {
    // Создаем модальное окно подтверждения в розовом стиле
    const modalHtml = `
        <div class="modal fade" id="deleteConfirmationModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">⚠️ Подтверждение удаления</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Вы уверены, что хотите удалить студента:</p>
                        <h6 class="text-center mb-3" style="color: var(--soft-coral);">${studentName}</h6>
                        <p class="text-muted"><small>Это действие нельзя отменить. Все данные студента будут удалены безвозвратно.</small></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-danger" onclick="deleteStudent(${studentId})">Удалить</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Добавляем модальное окно в DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));

    // Показываем модальное окно
    modal.show();

    // Удаляем модальное окно после закрытия
    document.getElementById('deleteConfirmationModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Функция для редактирования студента
window.editStudent = async function(studentId) {
    try {
        // Закрываем текущее модальное окно
        const modal = document.getElementById('studentModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }

        // Загружаем данные студента
        const response = await fetch(`/api/students/${studentId}/`);
        const student = await response.json();

        if (!response.ok) {
            showNotification('❌ Ошибка загрузки данных студента', 'error');
            return;
        }

        // Заполняем форму данными студента
        document.getElementById('lastName').value = student.last_name;
        document.getElementById('firstName').value = student.first_name;
        document.getElementById('patronymic').value = student.patronymic || '';
        document.getElementById('dateOfBirth').value = student.date_of_birth || '';
        document.getElementById('citizenship').value = student.citizenship || '';
        document.getElementById('phone').value = student.phone_number || '';
        document.getElementById('email').value = student.email || '';
        document.getElementById('admissionYear').value = student.year_of_admission;

        // Устанавливаем группу
        const groupSelect = document.getElementById('group');
        for (let option of groupSelect.options) {
            if (option.text.includes(student.group_name)) {
                option.selected = true;
                break;
            }
        }

        // Очищаем и заполняем дисциплины
        const subjectsContainer = document.getElementById('subjectsContainer');
        subjectsContainer.innerHTML = '';

        if (student.grades && student.grades.length > 0) {
            student.grades.forEach(grade => {
                addSubjectField(grade.subject, grade.grade);
            });
        } else {
            addSubjectField();
        }

        // Добавляем ID студента в форму для обновления
        let form = document.getElementById('studentForm');
        let hiddenInput = form.querySelector('input[name="student_id"]');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'student_id';
            form.appendChild(hiddenInput);
        }
        hiddenInput.value = studentId;

        // Изменяем текст кнопки и показываем кнопку отмены
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Обновить карточку';
        submitBtn.className = 'btn btn-success';

        // Показываем кнопку отмены
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-block';
        }

        // Прокручиваем к форме
        form.scrollIntoView({ behavior: 'smooth' });

        // Сбрасываем валидацию полей
        document.getElementById('lastName').classList.remove('is-valid', 'is-invalid');
        document.getElementById('firstName').classList.remove('is-valid', 'is-invalid');

    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Произошла ошибка при загрузке данных для редактирования', 'error');
    }
}

// Функция для удаления студента
window.deleteStudent = async function(studentId) {
    try {
        // Закрываем оба модальных окна
        const studentModal = document.getElementById('studentModal');
        if (studentModal) {
            const bsModal = bootstrap.Modal.getInstance(studentModal);
            if (bsModal) bsModal.hide();
        }

        const confirmationModal = document.getElementById('deleteConfirmationModal');
        if (confirmationModal) {
            const bsModal = bootstrap.Modal.getInstance(confirmationModal);
            if (bsModal) bsModal.hide();
        }

        const response = await fetch(`/api/students/${studentId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('✅ Студент успешно удален', 'success');
            // Обновляем таблицу студентов
            await loadStudentsTable();
        } else {
            const result = await response.json();
            showNotification('❌ Ошибка удаления: ' + (result.error || 'Неизвестная ошибка'), 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Произошла ошибка при удалении студента', 'error');
    }
}

// Функция для сброса формы
window.resetForm = function() {
    const form = document.getElementById('studentForm');
    form.reset();

    // Очищаем дисциплины
    const subjectsContainer = document.getElementById('subjectsContainer');
    subjectsContainer.innerHTML = '';

    // Удаляем скрытое поле student_id
    const studentIdInput = form.querySelector('input[name="student_id"]');
    if (studentIdInput) {
        studentIdInput.remove();
    }

    // Возвращаем кнопку в исходное состояние
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Сохранить карточку';
    submitBtn.className = 'btn btn-success';

    // Скрываем кнопку отмены
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    // Сбрасываем валидацию полей
    document.getElementById('lastName').classList.remove('is-valid', 'is-invalid');
    document.getElementById('firstName').classList.remove('is-valid', 'is-invalid');

    // Добавляем первую пару полей для дисциплины
    addSubjectField();
}

// Функция для добавления дисциплины
function addSubjectField(subject = '', grade = '') {
    const subjectsContainer = document.getElementById('subjectsContainer');
    const subjectDiv = document.createElement('div');
    subjectDiv.className = 'subject-row';
    subjectDiv.innerHTML = `
        <div class="d-flex gap-2 align-items-center">
            <input type="text" class="form-control" name="subjects"
                   placeholder="Название дисциплины" value="${subject}" required>
            <input type="text" class="form-control" name="grades"
                   placeholder="Оценка (5, Зачет и т.д.)" value="${grade}" required>
            <button type="button" class="btn btn-outline-danger remove-subject" onclick="this.closest('.subject-row').remove()">
                ×
            </button>
        </div>
    `;
    subjectsContainer.appendChild(subjectDiv);
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Удаляем предыдущие уведомления
    const oldNotifications = document.querySelectorAll('.custom-notification');
    oldNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `custom-notification alert-dismissible fade show position-fixed`;

    if (type === 'success') {
        notification.style.cssText = `
            background: linear-gradient(135deg, var(--primary-pink) 0%, var(--peach) 100%);
            color: white;
        `;
    } else {
        notification.style.cssText = `
            background: linear-gradient(135deg, var(--soft-coral) 0%, #ff6b81 100%);
            color: white;
        `;
    }

    notification.style.cssText += `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" style="filter: invert(1);"></button>
    `;

    document.body.appendChild(notification);

    // Автоматически удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
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

// Переменная для отслеживания, была ли таблица показана
let tableWasShown = false;

// Функция для загрузки таблицы студентов
function loadStudentsTable() {
    console.log('🔄 Загрузка таблицы студентов...');

    return new Promise(async (resolve) => {
        try {
            const tableCard = document.getElementById('studentsTableCard');
            const tbody = document.querySelector('#studentsTable tbody');

            // Очищаем таблицу
            tbody.innerHTML = '';

            const response = await fetch('/api/students/');

            if (!response.ok) {
                console.error('❌ Ошибка HTTP:', response.status);
                resolve();
                return;
            }

            const students = await response.json();

            if (!Array.isArray(students)) {
                console.error('❌ Данные не являются массивом');
                resolve();
                return;
            }

            console.log(`👥 Найдено студентов: ${students.length}`);

            if (students.length > 0) {
                students.forEach(student => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${student.full_name || 'Нет имени'}</td>
                        <td>${student.group_name || 'Нет группы'}</td>
                        <td>${student.specialty_name || 'Нет направления'}</td>
                        <td>${student.year_of_admission || 'Нет года'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewStudent(${student.student_id})">
                                Просмотр
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Показываем таблицу только если она уже была показана ранее
                if (tableWasShown) {
                    tableCard.style.display = 'block';
                    console.log('✅ Таблица показана (уже была показана ранее)');
                } else {
                    // При первой загрузке страницы таблица остается скрытой
                    tableCard.style.display = 'none';
                    console.log('📊 Таблица остается скрытой при первой загрузке');
                }
            } else {
                // Скрываем таблицу если нет студентов
                tableCard.style.display = 'none';
                tableWasShown = false;
                console.log('ℹ️ Студентов нет, таблица скрыта');
            }
            resolve();
        } catch (error) {
            console.error('💥 Ошибка загрузки студентов:', error);
            const tableCard = document.getElementById('studentsTableCard');
            tableCard.style.display = 'none';
            resolve();
        }
    });
}

// Функция для загрузки групп
async function loadGroups() {
    try {
        console.log('🔄 Загрузка групп...');
        const response = await fetch('/api/groups/');

        if (!response.ok) {
            console.error('❌ Ошибка загрузки групп:', response.status);
            return;
        }

        const groups = await response.json();
        console.log('📊 Получены группы:', groups);

        const groupSelect = document.getElementById('group');
        groupSelect.innerHTML = '<option value="">Выберите группу...</option>';

        if (Array.isArray(groups) && groups.length > 0) {
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.group_id;
                option.textContent = `${group.group_name} (${group.specialty_name})`;
                groupSelect.appendChild(option);
            });
            console.log('✅ Группы загружены');
        } else {
            console.warn('⚠️ Группы не получены или пустые');
        }
    } catch (error) {
        console.error('💥 Ошибка загрузки групп:', error);
    }
}

// ================================================
// DOMContentLoaded начинается здесь
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен');

    // Элементы DOM
    const studentForm = document.getElementById('studentForm');
    const groupSelect = document.getElementById('group');
    const subjectsContainer = document.getElementById('subjectsContainer');
    const addSubjectBtn = document.getElementById('addSubject');
    const studentsTableCard = document.getElementById('studentsTableCard');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    console.log('🎯 Элемент таблицы найден:', studentsTableCard);

    // Таблица уже скрыта через style="display: none;" в HTML
    console.log('👁️ Таблица скрыта через HTML атрибут');

    // Загружаем данные
    setTimeout(async () => {
        console.log('⏰ Начинаем загрузку данных...');
        await loadGroups();
        await loadStudentsTable();
        console.log('🏁 Загрузка данных завершена');
    }, 100);

    // Обработчики событий
    addSubjectBtn.addEventListener('click', () => addSubjectField());

    // Валидация полей Имя/Фамилия - сбрасываем при фокусе
    const lastNameInput = document.getElementById('lastName');
    const firstNameInput = document.getElementById('firstName');

    if (lastNameInput) {
        lastNameInput.addEventListener('input', function(e) {
            validateNameField(e);
            // Если поле пустое, сбрасываем валидацию
            if (!this.value.trim()) {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });

        lastNameInput.addEventListener('focus', function() {
            if (this.value.trim() === '') {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });
    }

    if (firstNameInput) {
        firstNameInput.addEventListener('input', function(e) {
            validateNameField(e);
            // Если поле пустое, сбрасываем валидацию
            if (!this.value.trim()) {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });

        firstNameInput.addEventListener('focus', function() {
            if (this.value.trim() === '') {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });
    }

    if (studentForm) {
        studentForm.addEventListener('submit', handleFormSubmit);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', window.resetForm);
    }

    // Добавляем первую пару полей для дисциплины при загрузке
    addSubjectField();

    // ===== ВНУТРЕННИЕ ФУНКЦИИ =====

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
        } else if (value) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        } else {
            field.classList.remove('is-valid', 'is-invalid');
        }
    }

    // Обработчик отправки формы
    async function handleFormSubmit(event) {
        event.preventDefault();

        if (!validateForm()) {
            showNotification('❌ Заполните обязательные поля (Фамилия, Имя, Группа)', 'error');
            return;
        }

        const formData = new FormData(studentForm);
        const studentId = formData.get('student_id');

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
            let url, method;

            if (studentId) {
                // Редактирование существующего студента
                url = `/api/students/${studentId}/update/`;
                method = 'PUT';
                studentData.student_id = parseInt(studentId);
            } else {
                // Создание нового студента
                url = '/api/students/create/';
                method = 'POST';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify(studentData)
            });

            const result = await response.json();

            if (response.ok) {
                const message = studentId ? '✅ Студент успешно обновлен!' : '✅ Студент успешно сохранен!';
                showNotification(message, 'success');
                window.resetForm();

                // Устанавливаем флаг, что таблица была показана
                tableWasShown = true;

                await loadStudentsTable();
            } else {
                showNotification('❌ Ошибка: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('❌ Произошла ошибка при сохранении', 'error');
        }
    }

    // Валидация всей формы перед отправкой
    function validateForm() {
        const lastName = document.getElementById('lastName');
        const firstName = document.getElementById('firstName');
        const group = document.getElementById('group');

        if (!lastName || !lastName.value.trim() ||
            !firstName || !firstName.value.trim() ||
            !group || !group.value) {
            return false;
        }

        if (lastName.classList.contains('is-invalid') || firstName.classList.contains('is-invalid')) {
            return false;
        }

        return true;
    }

}); // <-- ЗДЕСЬ ЗАКРЫВАЕТСЯ DOMContentLoaded