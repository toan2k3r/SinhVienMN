document.addEventListener('DOMContentLoaded', function () {
    const studentsList = document.getElementById('studentsList');
    const addBtn = document.getElementById('addBtn');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');

    const nameInput = document.getElementById('studentName');
    const ageInput = document.getElementById('studentAge');
    const majorInput = document.getElementById('studentMajor');
    const gpaInput = document.getElementById('studentGpa');

    let currentPage = 1;
    const itemsPerPage = 5;
    let totalStudents = 0;
    let editMode = false;
    let editingId = null;
    let isSearching = false;   // cờ để biết có đang tìm kiếm hay không
    let currentKeyword = "";

    // ---------------- HIỂN THỊ DANH SÁCH ----------------
    async function displayStudents(page = 1) {
        isSearching = false;
        currentPage = page;
        loadingElement.style.display = 'block';
        errorElement.textContent = '';
        studentsList.innerHTML = '';

        try {
            const result = await StudentApi.getStudentsWithPagination(page, itemsPerPage);
            totalStudents = result.total;
            renderStudents(result.data);
            updatePaginationControls(result.totalPages);
        } catch (error) {
            errorElement.textContent = `Lỗi: ${error.message}`;
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    // ---------------- TÌM KIẾM SINH VIÊN ----------------
    async function handleFind(page = 1) {
        isSearching = true;
        currentPage = page;
        currentKeyword = searchInput.value.trim();

        if (!currentKeyword) {
            // nếu không nhập gì thì quay về danh sách
            await displayStudents(1);
            return;
        }

        loadingElement.style.display = 'block';
        errorElement.textContent = '';
        studentsList.innerHTML = '';

        try {
            const result = await StudentApi.searchStudentsWithPagination(currentKeyword, page, itemsPerPage);
            totalStudents = result.total;
            renderStudents(result.data);

            if (result.data.length === 0) {
                studentsList.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không tìm thấy sinh viên nào</td></tr>';
            }

            updatePaginationControls(result.totalPages);
        } catch (error) {
            errorElement.textContent = `Lỗi tìm kiếm: ${error.message}`;
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    // ---------------- HIỂN THỊ DỮ LIỆU RA BẢNG ----------------
    function renderStudents(students) {
        studentsList.innerHTML = '';
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.age}</td>
                <td>${student.major}</td>
                <td>${student.gpa}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${student.id}">Sửa</button>
                    <button class="action-btn delete-btn" data-id="${student.id}">Xóa</button>
                </td>
            `;
            studentsList.appendChild(row);
        });

        // gắn sự kiện
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
    }

    // ---------------- PHÂN TRANG ----------------
    function updatePaginationControls(totalPages) {
        let paginationHTML = `
            <div class="pagination">
                <button id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Trước</button>
                <span>Trang ${currentPage} / ${totalPages}</span>
                <button id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>Tiếp</button>
            </div>
        `;
        const oldPagination = document.querySelector('.pagination');
        if (oldPagination) oldPagination.remove();
        studentsList.insertAdjacentHTML('afterend', paginationHTML);

        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (currentPage > 1) {
                isSearching ? handleFind(currentPage - 1) : displayStudents(currentPage - 1);
            }
        });
        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                isSearching ? handleFind(currentPage + 1) : displayStudents(currentPage + 1);
            }
        });
    }

    // ---------------- FORM & CRUD ----------------
    function validateStudent(student) {
        const errors = [];
        if (!student.name || student.name.length < 2) errors.push("Tên phải có ít nhất 2 ký tự");
        if (!student.age || student.age < 16 || student.age > 50) errors.push("Tuổi phải từ 16 - 50");
        if (!student.major || student.major.length < 2) errors.push("Ngành học phải có ít nhất 2 ký tự");
        if (isNaN(student.gpa) || student.gpa < 0 || student.gpa > 4) errors.push("GPA phải từ 0 - 4");
        return errors;
    }

    async function handleAddOrUpdate() {
        const student = {
            name: nameInput.value.trim(),
            age: parseInt(ageInput.value),
            major: majorInput.value.trim(),
            gpa: parseFloat(gpaInput.value)
        };

        const errors = validateStudent(student);
        if (errors.length > 0) {
            errorElement.innerHTML = errors.map(e => `* ${e}`).join('<br>');
            return;
        }

        try {
            if (editMode && editingId) {
                await StudentApi.updateStudent(editingId, student);
                addBtn.textContent = "Thêm Sinh Viên";
                editMode = false;
                editingId = null;
            } else {
                await StudentApi.addStudent(student);
            }

            clearForm();
            isSearching ? await handleFind(1) : await displayStudents(1);
        } catch (error) {
            errorElement.textContent = `Lỗi khi lưu sinh viên: ${error.message}`;
        }
    }

    async function handleEdit(e) {
        const id = e.target.getAttribute('data-id');
        try {
            const students = await StudentApi.getAllStudents();
            const student = students.find(s => s.id == id);
            if (student) {
                nameInput.value = student.name;
                ageInput.value = student.age;
                majorInput.value = student.major;
                gpaInput.value = student.gpa;

                addBtn.textContent = "Cập Nhật";
                editMode = true;
                editingId = id;
            }
        } catch (error) {
            errorElement.textContent = `Lỗi: ${error.message}`;
        }
    }

    async function handleDelete(e) {
        if (!confirm('Bạn có muốn xóa sinh viên này ?')) return;
        const id = e.target.getAttribute('data-id');
        try {
            await StudentApi.deleteStudent(id);
            isSearching ? await handleFind(currentPage) : await displayStudents(currentPage);
        } catch (error) {
            errorElement.textContent = `Lỗi khi xóa: ${error.message}`;
        }
    }

    function clearForm() {
        nameInput.value = "";
        ageInput.value = "";
        majorInput.value = "";
        gpaInput.value = "";
        errorElement.textContent = "";
    }

    // ---------------- GẮN SỰ KIỆN ----------------
    addBtn.addEventListener('click', handleAddOrUpdate);
    searchBtn.addEventListener('click', () => handleFind(1));
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleFind(1);
    });

    // load mặc định danh sách
    displayStudents();
});
