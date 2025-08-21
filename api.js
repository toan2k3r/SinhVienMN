const API_URL = 'http://localhost:3000/students';


function soSanhGanBang(str1, str2) {
    // Chuẩn hóa chuỗi
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Nếu giống nhau hoàn toàn
    if (s1 === s2) return true;

    // Kiểm tra các trường hợp gần bằng
    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Kiểm tra độ dài tương đối
    const minLength = Math.min(s1.length, s2.length);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength > 0 && minLength / maxLength >= 0.7) {
        // Kiểm tra số ký tự khớp
        let matchCount = 0;
        for (let i = 0; i < minLength; i++) {
            if (s1[i] === s2[i]) matchCount++;
        }

        if (matchCount / minLength >= 0.7) return true;
    }

    return false;
}
class StudentApi {
    static async getStudentsWithPagination(page = 1, limit = 5) {
        try {
            const response = await fetch(`${API_URL}?_page=${page}&_limit=${limit}&_sort=id&_order=desc`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const totalCount = parseInt(response.headers.get('X-Total-Count')) || 0;

            return {
                data: await response.json(),
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            };
        } catch (error) {
            console.error('Error fetching students with pagination:', error);
            throw error;
        }
    }
    static async searchStudentsWithPagination(keyword, page = 1, limit = 5) {
        try {
            const response = await fetch(
                `${API_URL}?q=${keyword}&_page=${page}&_limit=${limit}&_sort=id&_order=desc`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const totalCount = parseInt(response.headers.get('X-Total-Count') || 0);

            return {
                data: await response.json(),
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            };
        } catch (error) {
            console.error('Error searching students with pagination:', error);
            throw error;
        }
    }

    static async getAllStudents() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    }

    static async searchStudents(keyword) {
        try {
            const data = await this.getAllStudents();
            return data.filter(s => soSanhGanBang(s.name, keyword))
        } catch (error) {
            console.error('Error searching students:', error);
            throw error;
        }
    }

    static async addStudent(student) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(student)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error adding student:', error);
            throw error;
        }
    }

    static async updateStudent(id, student) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(student)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    }

    static async deleteStudent(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    }


}