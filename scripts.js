// Biến toàn cục
let courses = [];
let selectedCourseId = null;
let selectedCourseFile = null;
let questions = [];

// Hàm debounce để trì hoãn thực thi
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('Không tìm thấy searchInput');
        return;
    }

    document.getElementById('searchButton')?.addEventListener('click', searchQuestions);
    document.getElementById('clearButton')?.addEventListener('click', clearSearch);
    document.getElementById('changeCourseButton')?.addEventListener('click', showCourseList); // Sự kiện cho nút đổi khóa học
    searchInput.addEventListener('input', debounce(searchQuestions, 500));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchQuestions();
    });
    document.getElementById('darkModeToggle')?.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
    document.getElementById('courseSearch')?.addEventListener('input', filterCourses);
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchInfo = document.getElementById('searchInfo');
    const initialMessage = document.getElementById('initialMessage');
    const container = document.getElementById('coursesContainer');
    const changeCourseSection = document.getElementById('changeCourseSection');

    searchInput.value = '';
    questions = [];
    searchResults.innerHTML = '';
    if (initialMessage) {
        initialMessage.style.display = 'block';
    }
    if (searchInfo) {
        searchInfo.innerHTML = selectedCourseId 
            ? `Khóa học: <strong>${courses.find(c => c.course_id === selectedCourseId).course_name}</strong>`
            : 'Vui lòng chọn khóa học';
    }
    // Hiển thị lại danh sách khóa học nếu đang ẩn
    if (changeCourseSection && changeCourseSection.style.display === 'block') {
        container.style.display = 'block';
        changeCourseSection.style.display = 'none';
        displayCourses(courses);
    }
}

async function loadCourses() {
    const loading = document.getElementById('loadingCourses');
    if (!loading) {
        console.error('Không tìm thấy loadingCourses');
        return;
    }

    loading.style.display = 'block';
    try {
        const response = await fetch('https://letankim.id.vn/?act=get_courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            courses = data.data;
            displayCourses(courses);
        } else {
            console.error('Lỗi khi tải danh sách khóa học:', data);
        }
    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        loading.style.display = 'none';
    }
}

function displayCourses(courseList) {
    const container = document.getElementById('coursesContainer');
    const changeCourseSection = document.getElementById('changeCourseSection');
    if (!container || !changeCourseSection) {
        console.error('Không tìm thấy coursesContainer hoặc changeCourseSection');
        return;
    }

    container.innerHTML = '';
    courseList.forEach(course => {
        const div = document.createElement('div');
        div.className = `course-card ${selectedCourseId === course.course_id ? 'active' : ''}`;
        div.dataset.courseId = course.course_id;
        div.dataset.courseFile = course.course_file;
        div.innerHTML = `
            <div>
                <strong>${course.course_name}</strong>
                <span class="course-category">${getCourseCategory(course.course_name)}</span>
            </div>
            <span class="badge bg-primary rounded-pill">${course.course_id}</span>
        `;
        div.addEventListener('click', () => {
            document.querySelectorAll('.course-card').forEach(card => card.classList.remove('active'));
            div.className = 'course-card active';
            selectedCourseId = course.course_id;
            selectedCourseFile = course.course_file;
            const searchInfo = document.getElementById('searchInfo');
            if (searchInfo) {
                searchInfo.innerHTML = `Khóa học: <strong>${course.course_name}</strong>`;
            }
            // Ẩn danh sách khóa học và hiển thị nút đổi khóa học
            container.style.display = 'none';
            changeCourseSection.style.display = 'block';
        });
        container.appendChild(div);
    });
}

function filterCourses() {
    const searchTerm = document.getElementById('courseSearch')?.value.toLowerCase() || '';
    const filtered = courses.filter(course =>
        course.course_name.toLowerCase().includes(searchTerm) ||
        course.course_id.toLowerCase().includes(searchTerm)
    );
    displayCourses(filtered);
}

function getCourseCategory(courseName) {
    const prefix = courseName.substring(0, 3);
    const categories = {
        'ENW': 'Tiếng Anh', 'SSL': 'Bảo mật', 'HOM': 'Quản lý', 'HRM': 'Nhân sự',
        'MKT': 'Marketing', 'PRP': 'Lập trình', 'ITE': 'CNTT', 'WED': 'Thiết kế Web',
        'SWE': 'Phần mềm', 'OBE': 'Kinh doanh', 'IMC': 'Truyền thông', 'SSC': 'An ninh',
        'BDI': 'Phân tích dữ liệu', 'AIL': 'AI', 'CRY': 'Mật mã', 'MSM': 'Media',
        'PRC': 'Quy trình', 'DWP': 'Phát triển Web', 'WDU': 'Thiết kế UI',
        'PMG': 'Quản lý dự án', 'EPE': 'Kinh tế', 'ADS': 'Phân tích hệ thống',
        'ITA': 'Phân tích CNTT', 'MCO': 'Truyền thông', 'VNR': 'Việt Nam'
    };
    return categories[prefix] || 'Khác';
}

async function searchQuestions() {
    const searchTerm = document.getElementById('searchInput')?.value.trim();
    const loading = document.getElementById('loadingResults');
    const results = document.getElementById('searchResults');
    const initialMessage = document.getElementById('initialMessage');

    if (!loading || !results) {
        console.error('Không tìm thấy các phần tử DOM cần thiết:', {
            loadingExists: !!loading,
            resultsExists: !!results,
            initialMessageExists: !!initialMessage
        });
        return;
    }

    if (!selectedCourseId || !searchTerm) {
        results.innerHTML = `
            <div class="no-results">
                <i class="fas fa-info-circle mb-3"></i>
                <h4>Vui lòng hoàn thiện</h4>
                <p>${!selectedCourseId ? 'Chọn một khóa học' : ''} 
                   ${!searchTerm ? (!selectedCourseId ? 'và ' : '') + 'nhập từ khóa tìm kiếm' : ''} để tiếp tục.</p>
            </div>
        `;
        loading.style.display = 'none';
        results.style.display = 'block';
        if (initialMessage) initialMessage.style.display = 'none';
        return;
    }

    loading.style.display = 'block';
    results.style.display = 'none';
    if (initialMessage) initialMessage.style.display = 'none';

    try {
        const apiUrl = `https://letankim.id.vn/3do_resources/${selectedCourseFile}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        questions = data.filter(item =>
            item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.answer && item.answer.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        displayQuestions();

        const selectedCourse = courses.find(c => c.course_id === selectedCourseId);
        const searchInfo = document.getElementById('searchInfo');
        if (searchInfo) {
            searchInfo.innerHTML = `
                Khóa học: <strong>${selectedCourse.course_name}</strong> | 
                Từ khóa: <strong>${searchTerm}</strong> | 
                Kết quả: <strong>${questions.length}</strong>
            `;
        }
    } catch (error) {
        console.error('Lỗi khi tìm kiếm:', error);
        results.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle mb-3"></i>
                <h4>Đã xảy ra lỗi</h4>
                <p>Không thể tải dữ liệu câu hỏi. Vui lòng thử lại sau.</p>
            </div>
        `;
    } finally {
        loading.style.display = 'none';
        results.style.display = 'block';
    }
}

function displayQuestions() {
    const results = document.getElementById('searchResults');
    if (!results) {
        console.error('Không tìm thấy searchResults');
        return;
    }

    results.innerHTML = '';
    if (questions.length === 0) {
        results.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search mb-3"></i>
                <h4>Không tìm thấy kết quả</h4>
                <p>Không có câu hỏi nào phù hợp với từ khóa tìm kiếm.</p>
            </div>
        `;
        return;
    }

    const searchTerm = document.getElementById('searchInput')?.value.trim() || '';
    questions.forEach(item => {
        const div = document.createElement('div');
        div.className = 'question-card';
        div.innerHTML = `
            <h5>${highlightSearchTerm(item.question, searchTerm)}</h5>
            <div class="answer-card">
                <h6>Đáp án:</h6>
                <p>${highlightSearchTerm(item.answer || 'Không có đáp án', searchTerm)}</p>
            </div>
        `;
        results.appendChild(div);
    });
}

function highlightSearchTerm(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function showCourseList() {
    const container = document.getElementById('coursesContainer');
    const changeCourseSection = document.getElementById('changeCourseSection');
    if (!container || !changeCourseSection) {
        console.error('Không tìm thấy coursesContainer hoặc changeCourseSection');
        return;
    }

    container.style.display = 'block';
    changeCourseSection.style.display = 'none';
    displayCourses(courses);
}