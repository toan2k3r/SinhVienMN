document.addEventListener('DOMContentLoaded', function () {
    const studentsList = document.getElementById('studentsList');
    const addBtn = document.getElementById('addBtn');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const sortBtn = document.getElementById("sortBtn");
    const filterBtn = document.getElementById("filterBtn");
    const statsBtn = document.getElementById("statsBtn");

    const nameInput = document.getElementById('studentName');
    const ageInput = document.getElementById('studentAge');
    const majorInput = document.getElementById('studentMajor');
    const gpaInput = document.getElementById('studentGpa');

    let currentPage = 1;
    const itemsPerPage = 5;
    let totalStudents = 0;
    let editMode = false;
    let editingId = null;
    let studentsData = [];
    let studentsDataOriginal = [];

    async function displayStudents(resetPage = false) {
        if (resetPage) currentPage = 1;
        loadingElement.style.display = 'block';
        errorElement.textContent = '';
        studentsList.innerHTML = '';

        try {
            let keyword = searchInput.value.trim();
            let studentList = [];
            if (keyword) {
                studentList = await StudentApi.searchStudents(keyword);
            } else {
                studentList = await StudentApi.getAllStudents();
            }

            studentsDataOriginal = [...studentList]; // Lưu bản gốc
            studentsData = [...studentList];

            totalStudents = studentsData.length;
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageData = studentsData.slice(start, end);

            renderStudents(pageData);
            updatePaginationControls();

        } catch (error) {
            errorElement.textContent = `Lỗi: ${error.message}`;
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    function renderStudents(students) {
        currentStudents = students;
        studentsList.innerHTML = '';

        if (students.length === 0) {
            studentsList.innerHTML = `<tr><td colspan="6" style="text-align:center">Không có sinh viên nào</td></tr>`;
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.age}</td>
                <td>${student.major}</td>
                <td>${student.gpa}</td>
                <td>
                    <button class="edit-btn" data-id="${student.id}">Sửa</button>
                    <button class="delete-btn" data-id="${student.id}">Xóa</button>
                </td>
            `;
            studentsList.appendChild(row);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
    }

    async function applySort(field, order = 'asc') {
        const sorted = [...studentsData].sort((a, b) => {
            if (field === "name" || field === "major") {
                return order === "asc" ? a[field].localeCompare(b[field]) : b[field].localeCompare(a[field]);
            } else {
                return order === "asc" ? a[field] - b[field] : b[field] - a[field];
            }
        });
        studentsData = sorted;
        currentPage = 1;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        renderStudents(studentsData.slice(start, end));
        updatePaginationControls();
    }

    function showSortModal() {
        const modal = document.getElementById("modal");
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <h3>Sắp xếp sinh viên</h3>
            <select id="sortField">
                <option value="id">ID</option>
                <option value="name">Tên</option>
                <option value="age">Tuổi</option>
                <option value="gpa">GPA</option>
                <option value="major">Ngành Học</option>
            </select>
            <select id="sortOrder">
                <option value="asc">Tăng Dần</option>
                <option value="desc">Giảm Dần</option>
            </select>
            <button id="applySort">Áp Dụng</button>
        `;
        modal.style.display = "block";

        document.getElementById("applySort").addEventListener("click", () => {
            const field = document.getElementById("sortField").value;
            const order = document.getElementById("sortOrder").value;
            applySort(field, order);
            modal.style.display = "none";
        });
    }

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
            await displayStudents(true);
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
        if (!confirm('Bạn có muốn xóa sinh viên này?')) return;
        const id = e.target.getAttribute('data-id');
        try {
            await StudentApi.deleteStudent(id);
            await displayStudents();
        } catch (error) {
            errorElement.textContent = `Lỗi khi xóa: ${error.message}`;
        }
    }

    function updatePaginationControls() {
        const totalPages = Math.ceil(studentsData.length / itemsPerPage);
        const oldPagination = document.querySelector('.pagination');
        if (oldPagination) oldPagination.remove();

        let paginationHTML = `
            <div class="pagination">
                <button id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>Trước</button>
                <span>Trang ${currentPage} / ${totalPages}</span>
                <button id="nextPage" ${currentPage >= totalPages ? 'disabled' : ''}>Tiếp</button>
            </div>
        `;
        studentsList.insertAdjacentHTML('afterend', paginationHTML);

        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                renderStudents(studentsData.slice(start, end));
                updatePaginationControls();
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            const totalPages = Math.ceil(studentsData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                const start = (currentPage - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                renderStudents(studentsData.slice(start, end));
                updatePaginationControls();
            }
        });
    }

    function clearForm() {
        nameInput.value = "";
        ageInput.value = "";
        majorInput.value = "";
        gpaInput.value = "";
        errorElement.textContent = "";
    }

    sortBtn.addEventListener("click", showSortModal);

    filterBtn.addEventListener('click', () => {
        const minGpa = parseFloat(prompt("Nhập GPA tối thiểu", "0"));
        if (isNaN(minGpa)) return;

        // Clone dữ liệu gốc để filter mà không mất dữ liệu ban đầu
        const filtered = studentsDataOriginal.filter(s => s.gpa >= minGpa);
        studentsData = filtered;
        currentPage = 1;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        renderStudents(studentsData.slice(start, end));
        updatePaginationControls();
    });

    statsBtn.addEventListener('click', () => {
        if (studentsData.length === 0) {
            alert("Không có dữ liệu để thống kê!");
            return;
        }

        const gpaStats = StatisticsService.getGPAStatus(studentsData);
        const ageStats = StatisticsService.getAgeStats(studentsData);
        const majorDist = StatisticsService.getMajorDistribution(studentsData);
        const topStudents = StatisticsService.getTopStudents(studentsData, 5);

        // Hiển thị console (hoặc bạn có thể hiển thị trong modal/stats panel)
        console.log("GPA Stats:", gpaStats);
        console.log("Age Stats:", ageStats);
        console.log("Major Distribution:", majorDist);
        console.log("Top Students:", topStudents);

        alert(
            `Thống kê:\n` +
            `GPA: Trung bình ${gpaStats.average.toFixed(2)}, Min ${gpaStats.min}, Max ${gpaStats.max}\n` +
            `Tuổi: Trung bình ${ageStats.average.toFixed(1)}, Min ${ageStats.min}, Max ${ageStats.max}\n` +
            `Số sinh viên: ${gpaStats.total}\n` +
            `Top 5 GPA: ${topStudents.map(s => s.name + `(${s.gpa})`).join(", ")}`
        );
    });

    addBtn.addEventListener('click', handleAddOrUpdate);

    searchBtn.addEventListener('click', () => displayStudents(true));

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            displayStudents(true);
        }
    });

    document.getElementById('exportBtn').addEventListener('click', async () => {
        try {
            if (typeof XLSX === 'undefined') {
                alert("Thư viện XLSX chưa nạp!");
                return;
            }
            const students = await StudentApi.getAllStudents();
            if (!students || students.length === 0) {
                alert("Danh sách sinh viên trống");
                return;
            }
            const worksheet = XLSX.utils.json_to_sheet(students);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
            XLSX.writeFile(workbook, "student.xlsx");
        } catch (error) {
            console.error("Export Error:", error);
            alert("Xuất File Excel thất bại!");
        }
    });

    // Load dữ liệu lần đầu
    displayStudents();
});

