// Sidebar navigation logic
const links = document.querySelectorAll('.sidebar ul li a');
const mainContent = document.getElementById('main-content');

const sections = {
    'dashboard-link': '<h1>Dashboard</h1><p>Welcome to the class scheduler dashboard.</p>',
    'scheduler-link': '<h1>View/Edit Scheduler</h1><p>Here you can view and edit the class schedule.</p>',
    'teachers-link': '<h1>Manage Teachers</h1><p>Add, edit, or remove teachers.</p>',
    'students-link': '<h1>Manage Students</h1><p>Add, edit, or remove students.</p>',
    'rooms-link': '<h1>Manage Rooms</h1><p>Add, edit, or remove rooms.</p>',
    'courses-link': '<h1>Manage Courses</h1><p>Add, edit, or remove courses.</p>',
    'auto-generate-link': '<h1>Auto Generate Schedule</h1><p>Automatically generate a class schedule from your Excel data.</p>',
    'instructor-schedule-link': '<h1>Instructor Schedule</h1><p>View instructor schedule.</p>'
};

sections['auto-generate-link'] = `
    <h1>Auto Generate Schedule</h1>
    <p>Automatically generate a class schedule from your Excel data.</p>
    
    <div class="file-upload-container">
        <label for="excel-upload" class="file-upload-label">
            <div class="file-upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.92L7.13 8.97C8.08 7.14 9.94 6 12 6C14.62 6 16.88 7.86 17.39 10.43L17.69 11.93L19.22 12.04C20.78 12.14 22 13.45 22 15C22 16.65 20.65 18 19 18ZM8 13H10.55V16H13.45V13H16L12 9L8 13Z" fill="#3498db"/>
                </svg>
            </div>
            <div class="file-upload-text">Upload your Excel file</div>
            <div class="file-upload-subtext">Click to select your XLSX file with instructor, room, section, and subject data</div>
        </label>
        <input type="file" id="excel-upload" accept=".xlsx, .xls" style="display: none;" />
        <div id="excel-status" class="file-status">Upload an Excel file to begin</div>
    </div>
    
    <div id="generate-buttons" style="margin-top: 20px; display: none;">
        <button id="generate-section-btn" class="dashboard-card dashboard-quick-btn" style="margin-right: 10px; display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
            <span class="card-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/><rect x="7" y="9" width="2" height="2" fill="#6c63ff"/><rect x="11" y="9" width="2" height="2" fill="#6c63ff"/><rect x="15" y="9" width="2" height="2" fill="#6c63ff"/><rect x="7" y="13" width="2" height="2" fill="#6c63ff"/><rect x="11" y="13" width="2" height="2" fill="#6c63ff"/><rect x="15" y="13" width="2" height="2" fill="#6c63ff"/></svg>
            </span>
            <span class="card-label" style="color:#fff; font-size:1em;">Generate Section Schedules</span>
        </button>
        <button id="generate-instructor-btn" class="dashboard-card dashboard-quick-btn" style="margin-right: 10px; display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
            <span class="card-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><rect x="6" y="14" width="12" height="6" rx="3" fill="#6c63ff"/></svg>
            </span>
            <span class="card-label" style="color:#fff; font-size:1em;">Generate Instructor Schedules</span>
        </button>
        <button id="generate-smart-btn" class="dashboard-card dashboard-quick-btn" style="display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px; background: #27ae60;">
            <span class="card-icon">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="#fff"/><path d="M8 12h8M12 8v8" stroke="#27ae60" stroke-width="2" stroke-linecap="round"/></svg>
            </span>
            <span class="card-label" style="color:#fff; font-size:1em;">Generate Smart Schedule</span>
        </button>
    </div>
    
    <div id="generation-results" style="margin-top: 20px;"></div>
    <div id="smart-modal" class="modal" style="display:none;position:fixed;z-index:1000;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);justify-content:center;align-items:center;">
      <div class="modal-content" style="background:#fff;padding:24px 32px;border-radius:10px;max-width:600px;box-shadow:0 4px 32px rgba(0,0,0,0.18);position:relative;">
        <span id="close-smart-modal" style="position:absolute;top:12px;right:18px;font-size:1.7em;cursor:pointer;">&times;</span>
        <div id="smart-modal-body"></div>
      </div>
    </div>
`;

let scheduleData = null; // Global variable to store parsed schedule
let excelSheets = {
    instructors: null,
    rooms: null,
    students: null,
    subjects: null
};

let selectedSection = null;
let selectedInstructor = null;

// Add new functions for the new Excel format
function handleNewFormatExcel(workbook) {
    const sheets = workbook.SheetNames;
    const newFormat = {
        instructors: null,
        sections: null,
        subjects: null,
        rooms: null,
        courseAssignments: null
    };
    
    // Process Instructor sheet (first image format)
    const instructorSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[0]], { header: 1 });
    if (instructorSheet && instructorSheet.length > 0) {
        newFormat.instructors = processNewInstructorFormat(instructorSheet);
    }
    
    // Process Sections sheet (second image format)
    const sectionsSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[1]], { header: 1 });
    if (sectionsSheet && sectionsSheet.length > 0) {
        newFormat.sections = processNewSectionFormat(sectionsSheet);
    }
    
    // Process Subjects sheet (third image format)
    const subjectsSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[2]], { header: 1 });
    if (subjectsSheet && subjectsSheet.length > 0) {
        newFormat.subjects = processNewSubjectFormat(subjectsSheet);
    }
    
    // Process Rooms sheet (fourth image format)
    const roomsSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[3]], { header: 1 });
    if (roomsSheet && roomsSheet.length > 0) {
        newFormat.rooms = processNewRoomFormat(roomsSheet);
    }
    
    // Process Course Assignments sheet (fifth image format)
    const assignmentsSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[4]], { header: 1 });
    if (assignmentsSheet && assignmentsSheet.length > 0) {
        newFormat.courseAssignments = processNewAssignmentGridFormat(assignmentsSheet);
    }
    
    return newFormat;
}

// Improved robust parsing for new Excel format
function processNewInstructorFormat(sheet) {
    const instructors = [];
    let currentInstructor = null;
    sheet.forEach((row, idx) => {
        // Skip empty or header rows
        if (!row || row.length === 0 || (row[0] && row[0].toLowerCase().includes('professor'))) {
            if (row && row[0]) console.log(`[Instructor] Skipping header/empty row at ${idx}:`, row[0]);
            return;
        }
        // If row[0] is a name, start a new instructor
        if (row[0] && typeof row[0] === 'string' && row[0].trim() !== '') {
            currentInstructor = {
                name: row[0].trim(),
                specializations: [],
                time: row[2] ? row[2].toString().trim() : '',
                days: row[3] ? row[3].toString().trim() : ''
            };
            if (row[1] && row[1].toString().trim() !== '') currentInstructor.specializations.push(row[1].toString().trim());
            instructors.push(currentInstructor);
            console.log(`[Instructor] Parsed: ${currentInstructor.name}`);
        } else if (currentInstructor && row[1] && row[1].toString().trim() !== '') {
            // Additional specialization for current instructor
            currentInstructor.specializations.push(row[1].toString().trim());
            console.log(`[Instructor] Added specialization for ${currentInstructor.name}: ${row[1].toString().trim()}`);
        } else {
            console.log(`[Instructor] Skipped row at ${idx}:`, row);
        }
    });
    // Remove instructors with no name (just in case)
    const filtered = instructors.filter(i => i.name);
    console.log('[NewFormat] Parsed instructors:', filtered);
    return filtered;
}

function processNewSectionFormat(sheet) {
    const sections = sheet.slice(1).map(row => ({
        course: row[0] ? row[0].toString().trim() : '',
        yearLevel: row[1] ? row[1].toString().trim() : '',
        section: row[2] ? row[2].toString().trim() : '',
        students: row[3] ? parseInt(row[3], 10) : 40
    })).filter(section => section.course && section.section);
    console.log('[NewFormat] Parsed sections:', sections);
    return sections;
}

function processNewSubjectFormat(sheet) {
    const subjects = [];
    let currentCourse = null;
    let currentYear = null;
    let inTable = false;
    let codeIdx = 0, titleIdx = 1, creditIdx = 2;

    sheet.forEach((row, idx) => {
        if (!row || row.length === 0) {
            console.log(`[Subject] Skipping empty row at ${idx}`);
            return;
        }

        // Convert all cells to strings and trim
        const processedRow = row.map(cell => cell ? cell.toString().trim() : '');

        // Detect course/year header (very flexible)
        if (processedRow[0] && (
            processedRow[0].match(/\(.*\)/) || // has parentheses
            processedRow[0].match(/\d(st|nd|rd|th)\s*Year/i) || // has year number
            processedRow[0].match(/^[A-Z]+$/i) // is a course code
        )) {
            // Try to extract course from parentheses or use the whole text
            const match = processedRow[0].match(/\(([^)]+)\)/);
            currentCourse = match ? match[1].trim() : processedRow[0].trim();
            
            // Try to extract year from the header
            const yearMatch = processedRow[0].match(/(\d)(st|nd|rd|th)\s*Year/i);
            currentYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
            
            inTable = false;
            console.log(`[Subject] Found course/year header at ${idx}: course=${currentCourse}, year=${currentYear}`);
        } else if (
            processedRow.some(cell => cell.toLowerCase().includes('subject code')) &&
            processedRow.some(cell => cell.toLowerCase().includes('descriptive title'))
        ) {
            // This is the table header row - find column indices
            codeIdx = processedRow.findIndex(h => h.toLowerCase().includes('subject code'));
            titleIdx = processedRow.findIndex(h => h.toLowerCase().includes('descriptive title'));
            creditIdx = processedRow.findIndex(h => h.toLowerCase().includes('credit'));
            if (creditIdx === -1) creditIdx = 2; // Default to column 2 if not found
            
            inTable = true;
            console.log(`[Subject] Found table header at ${idx}: codeIdx=${codeIdx}, titleIdx=${titleIdx}, creditIdx=${creditIdx}`);
        } else if (
            inTable &&
            currentCourse &&
            currentYear &&
            processedRow[codeIdx] &&
            processedRow[titleIdx]
        ) {
            // This is a subject row
            const subject = {
                course: currentCourse,
                yearLevel: currentYear,
                code: processedRow[codeIdx],
                title: processedRow[titleIdx],
                credits: processedRow[creditIdx] ? parseInt(processedRow[creditIdx], 10) : 3
            };
            
            // Only add if we have both code and title
            if (subject.code && subject.title) {
                subjects.push(subject);
                console.log(`[Subject] Parsed subject at ${idx}:`, subject);
            } else {
                console.log(`[Subject] Skipped incomplete subject at ${idx}:`, processedRow);
            }
        } else if (
            processedRow[0] && (
                processedRow[0].match(/\(.*\)/) ||
                processedRow[0].toLowerCase().includes('subject code')
            )
        ) {
            // If we hit a new header or table header, reset inTable
            inTable = false;
            console.log(`[Subject] Hit new header/table at ${idx}`);
        } else {
            console.log(`[Subject] Skipped row at ${idx}:`, processedRow);
        }
    });

    console.log('[NewFormat] Parsed subjects:', subjects);
    return subjects;
}

function processNewRoomFormat(sheet) {
    const rooms = sheet.slice(1).map(row => ({
        room: row[0] ? row[0].toString().trim() : '',
        days: row[1] ? row[1].toString().trim() : '',
        timeSlot: row[2] ? row[2].toString().trim() : '',
        capacity: row[3] ? parseInt(row[3], 10) : 40
    })).filter(room => room.room && room.days);
    console.log('[NewFormat] Parsed rooms:', rooms);
    return rooms;
}

// New: Parse course assignments grid
function processNewAssignmentGridFormat(sheet) {
    if (!sheet || sheet.length < 2) return [];
    const assignments = [];
    const headerRow = sheet[0];
    // headerRow[0] is blank or 'BSAIS', headerRow[1..] are course names
    const courseNames = headerRow.slice(1).map(h => h ? h.toString().trim() : '');
    for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        if (!row || row.length < 2) continue;
        const subject = row[0] ? row[0].toString().trim() : '';
        for (let j = 1; j < row.length; j++) {
            const instructor = row[j] ? row[j].toString().trim() : '';
            if (instructor && subject && courseNames[j - 1]) {
                assignments.push({
                    course: courseNames[j - 1],
                    instructor: instructor,
                    subject: subject
                });
            }
        }
    }
    console.log('[NewFormat] Parsed course assignments:', assignments);
    return assignments;
}

// After parsing, load data into panels like the old code
function loadNewFormatPanels() {
    // Teachers panel
    if (excelSheets.instructors) {
        window.renderTeachersPanel && window.renderTeachersPanel(excelSheets.instructors);
    }
    // Students panel
    if (excelSheets.sections) {
        window.renderStudentsPanel && window.renderStudentsPanel(excelSheets.sections);
    }
    // Rooms panel
    if (excelSheets.rooms) {
        window.renderRoomsPanel && window.renderRoomsPanel(excelSheets.rooms);
    }
    // Courses panel
    if (excelSheets.subjects) {
        window.renderCoursesPanel && window.renderCoursesPanel(excelSheets.subjects);
    }
}

// Add new function to detect Excel format
function detectExcelFormat(workbook) {
    try {
        const sheets = workbook.SheetNames;
        if (!sheets || sheets.length === 0) return 'original';

        // Check for new format indicators across all sheets
        let newFormatIndicators = 0;
        let originalFormatIndicators = 0;

        for (const sheetName of sheets) {
            const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            if (!sheet || sheet.length === 0) continue;

            // Check first row for headers
            const firstRow = sheet[0].map(cell => cell ? cell.toString().toLowerCase() : '');
            
            // New format indicators
            if (firstRow.some(cell => cell.includes('professor')) && 
                firstRow.some(cell => cell.includes('specialization'))) {
                newFormatIndicators++;
            }
            if (firstRow.some(cell => cell.includes('subject code')) && 
                firstRow.some(cell => cell.includes('descriptive title'))) {
                newFormatIndicators++;
            }
            if (firstRow.some(cell => cell.includes('course')) && 
                firstRow.some(cell => cell.includes('year level'))) {
                newFormatIndicators++;
            }

            // Original format indicators
            if (firstRow.some(cell => cell.includes('instructor')) && 
                firstRow.some(cell => cell.includes('subject'))) {
                originalFormatIndicators++;
            }
            if (firstRow.some(cell => cell.includes('room')) && 
                firstRow.some(cell => cell.includes('capacity'))) {
                originalFormatIndicators++;
            }
        }

        // Log detection results
        console.log('[FormatDetection] New format indicators:', newFormatIndicators);
        console.log('[FormatDetection] Original format indicators:', originalFormatIndicators);

        // If we have more new format indicators, use new format
        return newFormatIndicators > originalFormatIndicators ? 'new' : 'original';
    } catch (error) {
        console.error('Error detecting Excel format:', error);
        return 'original';
    }
}

// Modify handleExcelUpload to use the new format when detected
const originalHandleExcelUpload = handleExcelUpload;
handleExcelUpload = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const statusEl = document.getElementById('excel-status');
    statusEl.className = 'file-status';
    statusEl.innerText = 'Reading file, please wait...';
    statusEl.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Detect format
            const format = detectExcelFormat(workbook);
            window.currentExcelFormat = format;
            
            if (format === 'new') {
                // Process using new format handlers
                const newFormatData = handleNewFormatExcel(workbook);
                
                // Store in global excelSheets with new format
                excelSheets = {
                    ...newFormatData,
                    format: 'new'
                };
                
                // Update status
                statusEl.className = 'file-status success';
                statusEl.innerText = 'Success! Loaded new format Excel file';
                
                // Show data summary
                const summaryEl = document.createElement('div');
                summaryEl.innerHTML = `
                    <div style="margin-top: 12px; font-size: 0.95em;">
                        <div>Instructors: ${newFormatData.instructors.length}</div>
                        <div>Sections: ${newFormatData.sections.length}</div>
                        <div>Subjects: ${newFormatData.subjects.length}</div>
                        <div>Rooms: ${newFormatData.rooms.length}</div>
                        <div>Course Assignments: ${newFormatData.courseAssignments.length}</div>
                    </div>
                `;
                statusEl.appendChild(summaryEl);
                
                // Show generate buttons
                document.getElementById('generate-buttons').style.display = 'block';
                
                // After statusEl.appendChild(summaryEl);
                // Add:
                // loadNewFormatPanels();
            } else {
                // Use original handler for old format
                originalHandleExcelUpload(e);
            }
        } catch (error) {
            console.error('Error processing Excel file:', error);
            statusEl.className = 'file-status error';
            statusEl.innerText = 'Error processing file: ' + error.message;
        }
    };
    
    reader.onerror = function() {
        statusEl.className = 'file-status error';
        statusEl.innerText = 'Error reading file. Please try again.';
    };
    
    reader.readAsArrayBuffer(file);
};

function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show loading status
    const statusEl = document.getElementById('excel-status');
    statusEl.className = 'file-status';
    statusEl.innerText = 'Reading file, please wait...';
    statusEl.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            // Parse all sheets
            const sheetNames = workbook.SheetNames;
            
            // Track which sheets were identified
            const foundSheets = {
                instructors: false,
                rooms: false,
                sections: false,
                subjects: false
            };
            
            // Find sheets by name instead of index
            for (let i = 0; i < sheetNames.length; i++) {
                const sheetName = sheetNames[i].toUpperCase();
                if (sheetName.includes('INSTRUCTOR')) {
                    excelSheets.instructors = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[i]], { header: 1 });
                    foundSheets.instructors = true;
                } else if (sheetName.includes('ROOM')) {
                    excelSheets.rooms = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[i]], { header: 1 });
                    foundSheets.rooms = true;
                } else if (sheetName.includes('SECTION')) {
                    excelSheets.students = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[i]], { header: 1 });
                    foundSheets.sections = true;
                } else if (sheetName.includes('SUBJECT')) {
                    excelSheets.subjects = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[i]], { header: 1 });
                    foundSheets.subjects = true;
                } else if (i === sheetNames.length - 1) {
                    // Last sheet is often the mapping sheet
                    excelSheets.mapping = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[i]], { header: 1 });
                }
            }
            
            // For backward compatibility
            scheduleData = excelSheets.instructors;
            // Debug: log loaded excelSheets
            console.log('[ExcelUpload] Sheets loaded:', excelSheets);
            
            // Check if all required sheets were found
            const missingSheets = [];
            if (!foundSheets.instructors) missingSheets.push('INSTRUCTOR');
            if (!foundSheets.rooms) missingSheets.push('ROOM');
            if (!foundSheets.sections) missingSheets.push('SECTION');
            if (!foundSheets.subjects) missingSheets.push('SUBJECT');
            
            if (missingSheets.length > 0) {
                statusEl.className = 'file-status error';
                statusEl.innerText = `Warning: Missing sheets: ${missingSheets.join(', ')}. Some features may not work correctly.`;
            } else {
                statusEl.className = 'file-status success';
                statusEl.innerText = `Success! All required sheets found: ${sheetNames.join(', ')}`;
                
                // Count data in each sheet
                const instructorCount = excelSheets.instructors ? excelSheets.instructors.length - 1 : 0;
                const roomCount = excelSheets.rooms ? excelSheets.rooms.length - 1 : 0;
                const sectionCount = excelSheets.students ? excelSheets.students.length - 1 : 0;
                const subjectCount = excelSheets.subjects ? excelSheets.subjects.length - 1 : 0;
                
                // Add data summary
                const summaryEl = document.createElement('div');
                summaryEl.innerHTML = `
                    <div style="margin-top: 12px; font-size: 0.95em;">
                        <div>Instructors: ${instructorCount}</div>
                        <div>Rooms: ${roomCount}</div>
                        <div>Sections: ${sectionCount}</div>
                        <div>Subjects: ${subjectCount}</div>
                    </div>
                `;
                statusEl.appendChild(summaryEl);
            }
            
            // Show generate buttons
            document.getElementById('generate-buttons').style.display = 'block';
            
            if (document.getElementById('section-select')) {
                attachSectionListener();
            }
        } catch (error) {
            console.error('Error processing Excel file:', error);
            statusEl.className = 'file-status error';
            statusEl.innerText = 'Error processing file: ' + error.message;
        }
    };
    
    reader.onerror = function() {
        statusEl.className = 'file-status error';
        statusEl.innerText = 'Error reading file. Please try again.';
    };
    
    reader.readAsArrayBuffer(file);
}

function getSectionsList() {
    if (!excelSheets.students || excelSheets.students.length < 2) return [];
    const rows = excelSheets.students.slice(1);
    return [...new Set(rows.map(r => r[2]).filter(Boolean))];
}

// Helper: assign a color to each subject
function getSubjectColors(subjects) {
    const palette = [
        '#b3e5fc', '#ffe082', '#c8e6c9', '#ffccbc', '#d1c4e9', '#f8bbd0', '#b2dfdb', '#f0f4c3', '#ffecb3', '#dcedc8',
        '#f48fb1', '#b39ddb', '#80cbc4', '#ffab91', '#e6ee9c', '#ce93d8', '#a5d6a7', '#ffd54f', '#90caf9', '#bcaaa4'
    ];
    const colorMap = {};
    let i = 0;
    subjects.forEach(sub => {
        if (!colorMap[sub]) {
            colorMap[sub] = palette[i % palette.length];
            i++;
        }
    });
    return colorMap;
}

// Helper: get all 30-min time slots between earliest and latest
function getAllTimeSlots(filteredRows, timeIdx) {
    // Collect all start and end times
    let times = [];
    filteredRows.forEach(r => {
        const slot = r[timeIdx];
        if (!slot) return;
        
        // Use the parseTimeRange function which handles both formats
        const parsedTime = parseTimeRange(slot);
        if (parsedTime) {
            times.push({ h: parsedTime.startHour, m: parsedTime.startMinute });
            times.push({ h: parsedTime.endHour, m: parsedTime.endMinute });
        }
    });
    
    if (times.length === 0) return [];
    
    // Find earliest and latest
    times.sort((a, b) => a.h !== b.h ? a.h - b.h : a.m - b.m);
    const start = times[0];
    const end = times[times.length - 1];
    
    // Normalize start time to nearest half hour (round down)
    let h = start.h;
    let m = start.m >= 30 ? 30 : 0;
    
    // Generate all 30-min slots
    let slots = [];
    while (h < end.h || (h === end.h && m < end.m)) {
        let nextH = h, nextM = m + 30;
        if (nextM >= 60) { nextH++; nextM = 0; }
        slots.push({
            label: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}-${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`,
            start: h * 60 + m,
            end: nextH * 60 + nextM
        });
        h = nextH; m = nextM;
    }
    return slots;
}

// Helper: format a single time in 12-hour format
function formatTime(h, m) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    let hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Helper: format a slot label in 12-hour format
function formatSlotLabel(slot) {
    const [start, end] = slot.label.split('-');
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    return `${formatTime(h1, m1)} - ${formatTime(h2, m2)}`;
}

// Helper: get course and year for a section from Sheet 3
function getCourseAndYearForSection(sectionName) {
    if (!excelSheets.students || excelSheets.students.length < 2) return null;
    const rows = excelSheets.students.slice(1);
    const match = rows.find(r => r[2] === sectionName);
    if (!match) return null;
    return { course: match[0], year: match[1] };
}

// Helper: get subject codes for a course and year from Sheet 4
function getSubjectCodesForCourseYear(course, year) {
    if (!excelSheets.subjects || excelSheets.subjects.length < 2) return [];
    const rows = excelSheets.subjects.slice(1);
    // Assuming Sheet 4 has columns: Subject Code, Subject Name, Required Specialization, Course, Year
    // If not, adjust the column indices accordingly
    // For now, let's assume subject codes are in column 0, course in column 3, year in column 4
    // If your Sheet 4 does not have course/year columns, you may need to add them for full automation
    // For now, fallback to all subject codes if not found
    const courseIdx = 3;
    const yearIdx = 4;
    const codeIdx = 0;
    if (excelSheets.subjects[0].length < 5) {
        // Fallback: return all subject codes
        return rows.map(r => r[codeIdx]).filter(Boolean);
    }
    return rows.filter(r => r[courseIdx] === course && String(r[yearIdx]) === String(year)).map(r => r[codeIdx]).filter(Boolean);
}

// Helper: get required specializations from Sheet 4
function getAllRequiredSpecializations() {
    if (!excelSheets.subjects || excelSheets.subjects.length < 2) return [];
    const rows = excelSheets.subjects.slice(1);
    const specIdx = 2; // Required Specialization
    return [...new Set(rows.map(r => r[specIdx]).filter(Boolean))];
}

// Helper: find an available room for a given day and time slot from Sheet 2
function findAvailableRoom(day, timeSlot) {
    if (!excelSheets.rooms || excelSheets.rooms.length < 2) return '';
    const headers = excelSheets.rooms[0];
    const rows = excelSheets.rooms.slice(1);
    const roomIdx = headers.findIndex(h => h && h.toLowerCase().includes('room'));
    const dayIdx = headers.findIndex(h => h && h.toLowerCase() === 'day');
    const timeIdx = headers.findIndex(h => h && h.toLowerCase().includes('time'));
    const match = rows.find(r => r[dayIdx] === day && r[timeIdx] === timeSlot);
    return match ? match[roomIdx] : '';
}

// Add new function to render smart schedule format
function renderSmartScheduler() {
    let html = '<h1>Generated Schedule</h1>';
    
    if (!excelSheets.smartMapping || excelSheets.smartMapping.length < 2) {
        return html + '<p>No smart schedule generated yet. Please use the Generate Smart Schedule button to create one.</p>';
    }
    
    const mapping = excelSheets.smartMapping;
    const header = mapping[0].map(h => h ? h.toString().toLowerCase() : '');
    
    // Get column indices for smart format
    const sectionIdx = header.findIndex(h => h.includes('section'));
    const courseIdx = header.findIndex(h => h.includes('course'));
    const yearIdx = header.findIndex(h => h.includes('year'));
    const subjectIdx = header.findIndex(h => h.includes('subject name'));
    const codeIdx = header.findIndex(h => h.includes('subject code'));
    const instructorIdx = header.findIndex(h => h.includes('instructor'));
    const dayIdx = header.findIndex(h => h === 'day');
    const timeIdx = header.findIndex(h => h.includes('time'));
    const roomIdx = header.findIndex(h => h.includes('room'));
    
    // Get all unique sections
    const allSections = [...new Set(mapping.slice(1).map(r => r[sectionIdx]).filter(Boolean))];
    if (!selectedSection || !allSections.includes(selectedSection)) {
        selectedSection = allSections[0];
    }
    
    // Section selector
    html += `<label for="section-select"><strong>Section:</strong></label> <select id="section-select">`;
    allSections.forEach(sec => {
        html += `<option value="${sec}"${sec === selectedSection ? ' selected' : ''}>${sec}</option>`;
    });
    html += '</select>';
    
    // Section info
    const sectionInfo = mapping.slice(1).find(r => r[sectionIdx] === selectedSection);
    if (sectionInfo) {
        html += `<div style="margin: 12px 0 24px 0;">
            <strong>Section:</strong> ${selectedSection}<br>
            <strong>Course:</strong> ${sectionInfo[courseIdx] || 'N/A'}<br>
            <strong>Year Level:</strong> ${sectionInfo[yearIdx] || 'N/A'}
        </div>`;
    }
    
    // Filter rows for this section
    const sectionRows = mapping.slice(1).filter(r => r[sectionIdx] === selectedSection);
    
    // Get unique days and sort them
    const days = [...new Set(sectionRows.map(r => r[dayIdx]))].filter(Boolean);
    days.sort((a, b) => ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(a) - ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(b));
    
    // Get unique time slots and sort them
    const timeSlots = [...new Set(sectionRows.map(r => r[timeIdx]))].filter(Boolean);
    timeSlots.sort((a, b) => {
        const timeA = parseTimeRange(a);
        const timeB = parseTimeRange(b);
        if (!timeA || !timeB) return 0;
        return timeA.startMinutes - timeB.startMinutes;
    });
    
    // Color coding for subjects
    const uniqueSubjects = [...new Set(sectionRows.map(r => r[subjectIdx]).filter(Boolean))];
    const subjectColors = getSubjectColors(uniqueSubjects);
    
    // Generate timetable
    html += '<div class="timetable-container"><table class="timetable"><thead><tr><th>Time Slot</th>';
    days.forEach(day => { html += `<th>${day}</th>`; });
    html += '</tr></thead><tbody>';
    
    if (timeSlots.length === 0) {
        html += '<tr><td colspan="'+(days.length+1)+'"><em>No time slots found for this section.</em></td></tr>';
    } else {
        // Track displayed classes to avoid duplication
        const displayedClasses = {};
        days.forEach(day => { displayedClasses[day] = new Set(); });
        
        timeSlots.forEach(timeSlot => {
            html += `<tr><td>${timeSlot}</td>`;
            
            days.forEach(day => {
                const classesInSlot = sectionRows.filter(r => 
                    r[dayIdx] === day && r[timeIdx] === timeSlot
                );
                
                if (classesInSlot.length > 0) {
                    html += '<td>';
                    classesInSlot.forEach(cls => {
                        const classKey = `${cls[subjectIdx]}_${cls[instructorIdx]}_${cls[roomIdx]}_${cls[timeIdx]}`;
                        if (!displayedClasses[day].has(classKey)) {
                            displayedClasses[day].add(classKey);
                            html += `
                                <div class="class-block" style="background:${subjectColors[cls[subjectIdx]]};margin-bottom:4px;">
                                    <strong>${cls[subjectIdx]}</strong><br>
                                    <span style="font-size:0.9em;">${cls[codeIdx]}</span><br>
                                    ${cls[instructorIdx]}<br>
                                    <span style="font-size:0.95em;">${cls[roomIdx]}</span>
                                </div>
                            `;
                        }
                    });
                    html += '</td>';
                } else {
                    html += '<td></td>';
                }
            });
            
            html += '</tr>';
        });
    }
    
    html += '</tbody></table></div>';
    
    return html;
}

// Modify the renderScheduler function to use the smart renderer when appropriate
function renderScheduler() {
    // Add mapping toggle UI
    let mappingType = window.currentMappingType;
    if (!mappingType && excelSheets.smartMapping && excelSheets.smartMapping.length > 1) {
        mappingType = 'smartMapping';
    } else if (!mappingType) {
        mappingType = 'mapping';
    }
    
    let toggleHtml = '';
    if (excelSheets.smartMapping && excelSheets.smartMapping.length > 1) {
        toggleHtml = `<div style='margin-bottom:12px;'><label><input type='radio' name='mapping-type' value='mapping' ${mappingType === 'mapping' ? 'checked' : ''}/> Original Mapping</label> &nbsp; <label><input type='radio' name='mapping-type' value='smartMapping' ${mappingType === 'smartMapping' ? 'checked' : ''}/> Smart Mapping</label></div>`;
    }
    
    // Use appropriate renderer based on mapping type
    if (mappingType === 'smartMapping' && excelSheets.smartMapping && excelSheets.smartMapping.length > 1) {
        const smartHtml = renderSmartScheduler();
        
        // Add toggle listener after rendering
        setTimeout(() => {
            const radios = document.getElementsByName('mapping-type');
            if (radios && radios.length) {
                radios.forEach(radio => {
                    radio.addEventListener('change', function() {
                        window.currentMappingType = this.value;
                        mainContent.innerHTML = renderScheduler();
                        attachSectionListener();
                    });
                });
            }
            attachSectionListener();
        }, 0);
        
        return toggleHtml + smartHtml;
    }
    
    // Original rendering logic continues here unchanged
    let mapping = excelSheets.mapping;
    if (!mapping || mapping.length < 2) {
        const mappingSheet = excelSheets[Object.keys(excelSheets)[4]];
        if (!mappingSheet || mappingSheet.length < 2) {
            return toggleHtml + '<h1>View/Edit Scheduler</h1><p>No mapping sheet found. Please upload the completed mapping sheet as Sheet 5.</p>';
        }
        mapping = mappingSheet;
    }
    
    // Get sections
    const sectionIdx = mapping[0].findIndex(h => h && h.toLowerCase().includes('section'));
    const yearIdx = mapping[0].findIndex(h => h && h.toLowerCase().includes('year'));
    const subjectIdx = mapping[0].findIndex(h => h && h.toLowerCase().includes('subject name'));
    const codeIdx = mapping[0].findIndex(h => h && h.toLowerCase().includes('subject code'));
    const instructorIdx = mapping[0].findIndex(h => h && h.toLowerCase().includes('instructor'));
    const dayIdx = mapping[0].findIndex(h => h && h.toLowerCase() === 'day');
    const timeIdx = mapping[0].findIndex(h => h && h.toLowerCase().includes('time'));
    const roomIdx = mapping[0].findIndex(h => h && h.toLowerCase().includes('room'));
    
    // Get all unique sections
    const allSections = [...new Set(mapping.slice(1).map(r => r[sectionIdx]).filter(Boolean))];
    if (!selectedSection || !allSections.includes(selectedSection)) selectedSection = allSections[0];
    
    let html = '<h1>Generated Schedule</h1>';
    html += `<label for="section-select"><strong>Section:</strong></label> <select id="section-select">`;
    allSections.forEach(sec => {
        html += `<option value="${sec}"${sec === selectedSection ? ' selected' : ''}>${sec}</option>`;
    });
    html += '</select>';
    html += `<div style="margin: 12px 0 24px 0;"><strong>Section:</strong> ${selectedSection}</div>`;
    
    // Filter mapping for this section
    const sectionRows = mapping.slice(1).filter(r => r[sectionIdx] === selectedSection);
    
    // Get all unique days and time slots
    const days = [...new Set(sectionRows.map(r => r[dayIdx]))].filter(Boolean);
    days.sort((a, b) => ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(a) - ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(b));
    
    // Get all unique time slots from the mapping for this section
    const uniqueTimeSlots = [...new Set(sectionRows.map(r => r[timeIdx]).filter(Boolean))];
    // Sort time slots chronologically
    uniqueTimeSlots.sort((a, b) => {
        const pa = parseTimeRange(a);
        const pb = parseTimeRange(b);
        return (pa?.startMinutes || 0) - (pb?.startMinutes || 0);
    });
    
    // Color coding per subject
    const uniqueSubjects = [...new Set(sectionRows.map(r => r[subjectIdx]).filter(Boolean))];
    const subjectColors = getSubjectColors(uniqueSubjects);
    
    html += '<div class="timetable-container"><table class="timetable"><thead><tr><th>Time Slot</th>';
    days.forEach(day => { html += `<th>${day}</th>`; });
    html += '</tr></thead><tbody>';
    
    if (uniqueTimeSlots.length === 0) {
        html += '<tr><td colspan="'+(days.length+1)+'"><em>No time slots generated. Check your time slot data format.</em></td></tr>';
    } else {
        // Track displayed classes to avoid duplication
        const displayedClasses = {};
        days.forEach(day => { displayedClasses[day] = new Set(); });
        
        uniqueTimeSlots.forEach((slotLabel) => {
            html += `<tr><td>${slotLabel}</td>`;
            days.forEach(day => {
                // Find all classes that match this slot and day
                const matches = sectionRows.filter(r => r[dayIdx] === day && r[timeIdx] === slotLabel);
                if (matches.length > 0) {
                    html += '<td>';
                    matches.forEach(match => {
                        const classKey = `${match[subjectIdx]}_${match[instructorIdx]}_${match[roomIdx]}_${match[timeIdx]}`;
                        if (!displayedClasses[day].has(classKey)) {
                            displayedClasses[day].add(classKey);
                            html += `<div class="class-block" style="background:${subjectColors[match[subjectIdx]]};margin-bottom:4px;">
                                <strong>${match[subjectIdx]}</strong><br>${match[instructorIdx]}<br><span style='font-size:0.95em;'>${match[roomIdx]}</span>
                            </div>`;
                        }
                    });
                    html += '</td>';
                } else {
                    html += '<td></td>';
                }
            });
            html += '</tr>';
        });
    }
    
    html += '</tbody></table></div>';
    
    // Add toggle listener after rendering
    setTimeout(() => {
        const radios = document.getElementsByName('mapping-type');
        if (radios && radios.length) {
            radios.forEach(radio => {
                radio.addEventListener('change', function() {
                    window.currentMappingType = this.value;
                    mainContent.innerHTML = renderScheduler();
                    attachSectionListener();
                });
            });
        }
        attachSectionListener();
    }, 0);
    
    return toggleHtml + html;
}

sections['scheduler-link'] = renderScheduler;

// Listen for section selector changes after rendering scheduler
function attachSectionListener() {
    const select = document.getElementById('section-select');
    if (select) {
        select.addEventListener('change', function() {
            selectedSection = this.value;
            // Re-render scheduler and re-attach listener
            mainContent.innerHTML = renderScheduler();
            attachSectionListener();
        });
    }
}

function attachExcelListener() {
    const upload = document.getElementById('excel-upload');
    if (upload) {
        upload.addEventListener('change', handleExcelUpload);
        // Add listeners for generate buttons
        const generateSectionBtn = document.getElementById('generate-section-btn');
        const generateInstructorBtn = document.getElementById('generate-instructor-btn');
        const generateSmartBtn = document.getElementById('generate-smart-btn');
        if (generateSectionBtn) {
            generateSectionBtn.addEventListener('click', function() {
                generateSectionSchedules();
            });
        }
        if (generateInstructorBtn) {
            generateInstructorBtn.addEventListener('click', function() {
                generateInstructorSchedules();
            });
        }
        if (generateSmartBtn) {
            generateSmartBtn.addEventListener('click', function() {
                generateSmartSchedule();
            });
        }
    }
}

links.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        links.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        let section = sections[this.id];
        if (typeof section === 'function') section = section();
        mainContent.innerHTML = section;
        if (this.id === 'auto-generate-link') {
            attachExcelListener();
        }
        if (this.id === 'scheduler-link') {
            attachSectionListener();
        }
        if (this.id === 'instructor-schedule-link') {
            attachInstructorListener();
        }
    });
});

// Set default section
links[0].classList.add('active');
let defaultSection = sections[links[0].id];
if (typeof defaultSection === 'function') defaultSection = defaultSection();
mainContent.innerHTML = defaultSection;
if (links[0].id === 'auto-generate-link') {
    attachExcelListener();
}
if (links[0].id === 'scheduler-link') {
    attachSectionListener();
}
if (links[0].id === 'instructor-schedule-link') {
    attachInstructorListener();
}

// Auto-trigger the Auto Generate Schedule panel initially 
// This ensures it's ready to use right away
setTimeout(() => {
    const autoGenerateLink = document.getElementById('auto-generate-link');
    if (autoGenerateLink) {
        autoGenerateLink.click();
    }
}, 100);

function getColumnIndex(headers, name) {
    return headers.findIndex(h => h && h.toLowerCase().includes(name));
}

function renderTeachers() {
    if (!excelSheets.instructors || excelSheets.instructors.length < 2) {
        return '<h1>Manage Teachers</h1><p>No data loaded. Please upload an Excel file in Auto Generate Schedule.</p>';
    }
    const headers = excelSheets.instructors[0];
    const rows = excelSheets.instructors.slice(1);
    const instructorIdx = headers.findIndex(h => h && h.toLowerCase().includes('instructor'));
    const deptIdx = headers.findIndex(h => h && h.toLowerCase().includes('department'));
    const specIdx = headers.findIndex(h => h && h.toLowerCase().includes('specialization'));
    let html = '<h1>Manage Teachers</h1>';
    html += `<div class="teacher-search-bar"><input type="text" id="teacher-search" placeholder="Search teachers..." autocomplete="off" />`;
    html += `<button id="teacher-search-btn" aria-label="Search"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="7" stroke="#3498db" stroke-width="2"/><line x1="14.4142" y1="14" x2="18" y2="17.5858" stroke="#3498db" stroke-width="2" stroke-linecap="round"/></svg></button></div>`;
    html += `<div class="teacher-sort-bar"><label for="teacher-sort" style="font-weight:500;margin-right:8px;">Sort by:</label><select id="teacher-sort"><option value="instructor">Instructor</option><option value="department">Department</option><option value="specialization">Specialization</option></select></div>`;
    html += '<div class="timetable-container">';
    html += '<table class="teachers-table"><thead><tr>';
    html += '<th>Instructor</th><th>Department</th><th>Specialization</th>';
    html += '</tr></thead><tbody id="teachers-table-body">';
    function renderRows(displayRows) {
        let body = '';
        displayRows.forEach(r => {
            body += '<tr>';
            body += `<td>${r[instructorIdx] || ''}</td>`;
            body += `<td>${r[deptIdx] || ''}</td>`;
            body += `<td>${r[specIdx] || ''}</td>`;
            body += '</tr>';
        });
        return body;
    }
    html += renderRows(rows);
    html += '</tbody></table></div>';
    // Add search/filter/sort logic
    setTimeout(() => {
        const input = document.getElementById('teacher-search');
        const btn = document.getElementById('teacher-search-btn');
        const tbody = document.getElementById('teachers-table-body');
        const sortSelect = document.getElementById('teacher-sort');
        let currentRows = [...rows];
        function filterAndSortRows() {
            const val = input.value.trim().toLowerCase();
            let filtered = rows.filter(r => {
                const instructor = (r[instructorIdx] || '').toString().toLowerCase();
                const dept = (r[deptIdx] || '').toString().toLowerCase();
                const spec = (r[specIdx] || '').toString().toLowerCase();
                return instructor.includes(val) || dept.includes(val) || spec.includes(val);
            });
            // Sort
            const sortBy = sortSelect.value;
            let sortIdx = instructorIdx;
            if (sortBy === 'department') sortIdx = deptIdx;
            if (sortBy === 'specialization') sortIdx = specIdx;
            filtered.sort((a, b) => {
                const aVal = (a[sortIdx] || '').toString().toLowerCase();
                const bVal = (b[sortIdx] || '').toString().toLowerCase();
                return aVal.localeCompare(bVal);
            });
            tbody.innerHTML = renderRows(filtered);
        }
        input.addEventListener('input', filterAndSortRows);
        btn.addEventListener('click', filterAndSortRows);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') filterAndSortRows(); });
        sortSelect.addEventListener('change', filterAndSortRows);
    }, 0);
    return html;
}

function renderStudents() {
    if (!excelSheets.students || excelSheets.students.length < 2) {
        return '<h1>Manage Students</h1><p>No data loaded. Please upload an Excel file in Auto Generate Schedule.</p>';
    }
    const headers = excelSheets.students[0];
    const rows = excelSheets.students.slice(1);
    const courseIdx = headers.findIndex(h => h && h.toLowerCase().includes('course'));
    const yearIdx = headers.findIndex(h => h && h.toLowerCase().includes('year'));
    const sectionIdx = headers.findIndex(h => h && h.toLowerCase().includes('section'));
    const studentsIdx = headers.findIndex(h => h && h.toLowerCase().includes('student'));
    let html = '<h1>Manage Students</h1>';
    html += `<div class="student-sort-bar"><label for="student-sort" style="font-weight:500;margin-right:8px;">Sort by:</label><select id="student-sort"><option value="course">Course</option><option value="year">Year Level</option><option value="section">Section</option><option value="students">Students</option></select></div>`;
    html += '<div class="timetable-container">';
    html += '<table class="teachers-table"><thead><tr>';
    html += '<th>Course</th><th>Year Level</th><th>Section</th><th>Students</th>';
    html += '</tr></thead><tbody id="students-table-body">';
    function renderRows(displayRows) {
        let body = '';
        displayRows.forEach(r => {
            body += '<tr>';
            body += `<td>${r[courseIdx] || ''}</td>`;
            body += `<td>${r[yearIdx] || ''}</td>`;
            body += `<td>${r[sectionIdx] || ''}</td>`;
            body += `<td>${r[studentsIdx] || ''}</td>`;
            body += '</tr>';
        });
        return body;
    }
    html += renderRows(rows);
    html += '</tbody></table></div>';
    // Add sort logic
    setTimeout(() => {
        const sortSelect = document.getElementById('student-sort');
        const tbody = document.getElementById('students-table-body');
        function sortRows() {
            const sortBy = sortSelect.value;
            let sortIdx = courseIdx;
            if (sortBy === 'year') sortIdx = yearIdx;
            if (sortBy === 'section') sortIdx = sectionIdx;
            if (sortBy === 'students') sortIdx = studentsIdx;
            const sorted = [...rows].sort((a, b) => {
                const aVal = (a[sortIdx] || '').toString().toLowerCase();
                const bVal = (b[sortIdx] || '').toString().toLowerCase();
                return aVal.localeCompare(bVal);
            });
            tbody.innerHTML = renderRows(sorted);
        }
        sortSelect.addEventListener('change', sortRows);
    }, 0);
    return html;
}

function renderRooms() {
    if (!excelSheets.rooms || excelSheets.rooms.length < 2) {
        return '<h1>Manage Rooms</h1><p>No data loaded. Please upload an Excel file in Auto Generate Schedule.</p>';
    }
    const headers = excelSheets.rooms[0];
    const rows = excelSheets.rooms.slice(1);
    const roomIdx = headers.findIndex(h => h && h.toLowerCase().includes('room'));
    const dayIdx = headers.findIndex(h => h && h.toLowerCase() === 'day');
    const timeIdx = headers.findIndex(h => h && h.toLowerCase().includes('time'));
    const capIdx = headers.findIndex(h => h && h.toLowerCase().includes('max'));
    let html = '<h1>Manage Rooms</h1>';
    html += `<div class="room-sort-bar"><label for="room-sort" style="font-weight:500;margin-right:8px;">Sort by:</label><select id="room-sort"><option value="room">Room</option><option value="day">Day</option><option value="time">Time Slot</option><option value="capacity">Max Capacity</option></select></div>`;
    html += '<div class="timetable-container">';
    html += '<table class="teachers-table"><thead><tr>';
    html += '<th>Room</th><th>Day</th><th>Time Slot</th><th>Max Capacity</th>';
    html += '</tr></thead><tbody id="rooms-table-body">';
    function renderRows(displayRows) {
        let body = '';
        displayRows.forEach(r => {
            body += '<tr>';
            body += `<td>${r[roomIdx] || ''}</td>`;
            body += `<td>${r[dayIdx] || ''}</td>`;
            body += `<td>${r[timeIdx] || ''}</td>`;
            body += `<td>${r[capIdx] || ''}</td>`;
            body += '</tr>';
        });
        return body;
    }
    html += renderRows(rows);
    html += '</tbody></table></div>';
    // Add sort logic
    setTimeout(() => {
        const sortSelect = document.getElementById('room-sort');
        const tbody = document.getElementById('rooms-table-body');
        function sortRows() {
            const sortBy = sortSelect.value;
            let sortIdx = roomIdx;
            if (sortBy === 'day') sortIdx = dayIdx;
            if (sortBy === 'time') sortIdx = timeIdx;
            if (sortBy === 'capacity') sortIdx = capIdx;
            const sorted = [...rows].sort((a, b) => {
                const aVal = (a[sortIdx] || '').toString().toLowerCase();
                const bVal = (b[sortIdx] || '').toString().toLowerCase();
                return aVal.localeCompare(bVal);
            });
            tbody.innerHTML = renderRows(sorted);
        }
        sortSelect.addEventListener('change', sortRows);
    }, 0);
    return html;
}

function renderCourses() {
    if (!excelSheets.subjects || excelSheets.subjects.length < 2) {
        return '<h1>Manage Courses</h1><p>No data loaded. Please upload an Excel file in Auto Generate Schedule.</p>';
    }
    const headers = excelSheets.subjects[0];
    const rows = excelSheets.subjects.slice(1);
    const codeIdx = headers.findIndex(h => h && h.toLowerCase().includes('subject code'));
    const nameIdx = headers.findIndex(h => h && h.toLowerCase().includes('subject name'));
    const specIdx = headers.findIndex(h => h && h.toLowerCase().includes('specialization'));
    let html = '<h1>Manage Courses</h1>';
    html += `<div class="course-sort-bar"><label for="course-sort" style="font-weight:500;margin-right:8px;">Sort by:</label><select id="course-sort"><option value="code">Subject Code</option><option value="name">Subject Name</option><option value="spec">Required Specialization</option></select></div>`;
    html += '<div class="timetable-container">';
    html += '<table class="teachers-table"><thead><tr>';
    html += '<th>Subject Code</th><th>Subject Name</th><th>Required Specialization</th>';
    html += '</tr></thead><tbody id="courses-table-body">';
    function renderRows(displayRows) {
        let body = '';
        displayRows.forEach(r => {
            body += '<tr>';
            body += `<td>${r[codeIdx] || ''}</td>`;
            body += `<td>${r[nameIdx] || ''}</td>`;
            body += `<td>${r[specIdx] || ''}</td>`;
            body += '</tr>';
        });
        return body;
    }
    html += renderRows(rows);
    html += '</tbody></table></div>';
    // Add sort logic
    setTimeout(() => {
        const sortSelect = document.getElementById('course-sort');
        const tbody = document.getElementById('courses-table-body');
        function sortRows() {
            const sortBy = sortSelect.value;
            let sortIdx = codeIdx;
            if (sortBy === 'name') sortIdx = nameIdx;
            if (sortBy === 'spec') sortIdx = specIdx;
            const sorted = [...rows].sort((a, b) => {
                const aVal = (a[sortIdx] || '').toString().toLowerCase();
                const bVal = (b[sortIdx] || '').toString().toLowerCase();
                return aVal.localeCompare(bVal);
            });
            tbody.innerHTML = renderRows(sorted);
        }
        sortSelect.addEventListener('change', sortRows);
    }, 0);
    return html;
}

sections['teachers-link'] = renderTeachers;
sections['students-link'] = renderStudents;
sections['rooms-link'] = renderRooms;
sections['courses-link'] = renderCourses;

// Helper: get all unique instructors from Sheet 1
function getAllInstructors() {
    if (!excelSheets.instructors || excelSheets.instructors.length < 2) return [];
    const headers = excelSheets.instructors[0];
    const rows = excelSheets.instructors.slice(1);
    const instructorIdx = headers.findIndex(h => h && h.toLowerCase().includes('instructor'));
    return [...new Set(rows.map(r => r[instructorIdx]).filter(Boolean))];
}

function renderInstructorSchedule() {
    // Add mapping toggle UI
    let mappingType = window.currentMappingType || 'mapping';
    let toggleHtml = '';
    if (excelSheets.smartMapping && excelSheets.smartMapping.length > 1) {
        toggleHtml = `<div style='margin-bottom:12px;'><label><input type='radio' name='mapping-type' value='mapping' ${mappingType === 'mapping' ? 'checked' : ''}/> Original Mapping</label> &nbsp; <label><input type='radio' name='mapping-type' value='smartMapping' ${mappingType === 'smartMapping' ? 'checked' : ''}/> Smart Mapping</label></div>`;
    }
    // Use selected mapping
    let mapping = (mappingType === 'smartMapping' && excelSheets.smartMapping && excelSheets.smartMapping.length > 1) ? excelSheets.smartMapping : (excelSheets.mapping || excelSheets[Object.keys(excelSheets)[4]]);
    if (!mapping || mapping.length < 2) {
        return '<h1>Instructor Schedule</h1><p>No mapping data loaded. Please upload an Excel file in Auto Generate Schedule.</p>';
    }
    // Always get indices from the mapping header row
    const header = mapping[0].map(h => h ? h.toString().toLowerCase() : '');
    const sectionIdx = header.findIndex(h => h.includes('section'));
    const yearIdx = header.findIndex(h => h.includes('year'));
    const subjectIdx = header.findIndex(h => h.includes('subject name'));
    const codeIdx = header.findIndex(h => h.includes('subject code'));
    const instructorIdx = header.findIndex(h => h.includes('instructor'));
    const dayIdx = header.findIndex(h => h === 'day');
    const timeIdx = header.findIndex(h => h.includes('time'));
    const roomIdx = header.findIndex(h => h.includes('room'));
    // Get all unique sections
    const allSections = [...new Set(mapping.slice(1).map(r => r[sectionIdx]).filter(Boolean))];
    if (!selectedSection || !allSections.includes(selectedSection)) selectedSection = allSections[0];
    let html = '<h1>Instructor Schedule</h1>' + toggleHtml;
    html += `<label for="instructor-select"><strong>Instructor:</strong></label> <select id="instructor-select">`;
    getAllInstructors().forEach(inst => {
        html += `<option value="${inst}"${inst === selectedInstructor ? ' selected' : ''}>${inst}</option>`;
    });
    html += '</select>';
    html += `<div style="margin: 12px 0 24px 0;"><strong>Instructor:</strong> ${selectedInstructor}</div>`;
    // Filter for this instructor
    const instructorRows = mapping.slice(1).filter(r => r[instructorIdx] === selectedInstructor);
    // Get all unique days and time slots
    const days = [...new Set(instructorRows.map(r => r[dayIdx]))].filter(Boolean);
    days.sort((a, b) => ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(a) - ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(b));
    const allSlots = getAllTimeSlots(instructorRows, timeIdx);
    // Color coding per subject
    const uniqueSubjects = [...new Set(instructorRows.map(r => r[subjectIdx]).filter(Boolean))];
    const subjectColors = getSubjectColors(uniqueSubjects);
    html += '<div class="timetable-container"><table class="timetable"><thead><tr><th>Time Slot</th>';
    days.forEach(day => { html += `<th>${day}</th>`; });
    html += '</tr></thead><tbody>';
    if (allSlots.length === 0) {
        html += '<tr><td colspan="'+(days.length+1)+'"><em>No time slots generated. Check your time slot data format.</em></td></tr>';
    }
    
    let foundAnyClass = false;
    
    // Track displayed classes to avoid duplication
    const displayedClasses = {};
    days.forEach(day => { displayedClasses[day] = new Set(); });
    
    allSlots.forEach((slot, slotIndex) => {
        html += `<tr><td>${formatSlotLabel(slot)}</td>`;
        days.forEach(day => {
            // Find all classes that cover this slot and day
            const matches = instructorRows.filter(r => {
                const t = r[timeIdx];
                if (!t) return false;
                
                const parsedTime = parseTimeRange(t);
                if (!parsedTime) return false;
                
                // Check if this time slot overlaps with the class time
                // A class covers a slot if the class starts before or at slot end AND class ends after or at slot start
                return r[dayIdx] === day && 
                       parsedTime.startMinutes <= slot.end && 
                       parsedTime.endMinutes >= slot.start;
            });
            
            if (matches.length > 0) {
                foundAnyClass = true;
                html += '<td>';
                
                // Filter out already displayed classes
                const newMatches = matches.filter(match => {
                    // Create a unique key for each class entry
                    const classKey = `${match[subjectIdx]}_${match[roomIdx]}_${match[timeIdx]}`;
                    
                    // Check if we've already displayed this class in this day
                    if (displayedClasses[day].has(classKey)) {
                        return false;
                    }
                    
                    // Check if this class spans multiple slots
                    // Only display on the first slot it appears in
                    const parsedTime = parseTimeRange(match[timeIdx]);
                    if (parsedTime) {
                        // Find the earliest slot this class covers
                        const earliestSlotIndex = allSlots.findIndex(s => 
                            s.end > parsedTime.startMinutes && s.start < parsedTime.endMinutes
                        );
                        
                        // Only show if this is the first slot it appears in
                        if (earliestSlotIndex === slotIndex) {
                            // Mark this class as displayed for this day
                            displayedClasses[day].add(classKey);
                            return true;
                        }
                    }
                    
                    return false;
                });
                
                // Render the filtered matches
                newMatches.forEach(match => {
                    const parsedTime = parseTimeRange(match[timeIdx]);
                    if (parsedTime) {
                        // Calculate how many slots this class spans
                        let spanCount = 1;
                        const classEndTime = parsedTime.endMinutes;
                        for (let i = slotIndex + 1; i < allSlots.length; i++) {
                            if (allSlots[i].start < classEndTime) {
                                spanCount++;
                            } else {
                                break;
                            }
                        }
                        
                        // Auto-assign room from Sheet 2
                        const assignedRoom = findAvailableRoom(day, match[timeIdx]);
                        
                        html += `<div class="class-block" style="background:${subjectColors[match[subjectIdx]]};margin-bottom:4px;`;
                        if (spanCount > 1) {
                            html += `height:${spanCount * 28}px;`;
                        }
                        html += `"><strong>${match[subjectIdx]}</strong><br><span style='font-size:0.95em;'>${assignedRoom}</span></div>`;
                    }
                });
                
                html += '</td>';
            } else {
                html += '<td></td>';
            }
        });
        html += '</tr>';
    });
    
    if (!foundAnyClass && allSlots.length > 0) {
        html += '<tr><td colspan="'+(days.length+1)+'"><em>No classes found for these slots and instructor.</em></td></tr>';
    }
    html += '</tbody></table></div>';
    // ... existing code ...
    // (rest of the function remains unchanged)
    // ... existing code ...
    setTimeout(() => {
        // Attach toggle listener
        const radios = document.getElementsByName('mapping-type');
        if (radios && radios.length) {
            radios.forEach(radio => {
                radio.addEventListener('change', function() {
                    window.currentMappingType = this.value;
                    mainContent.innerHTML = renderInstructorSchedule();
                    attachInstructorListener();
                });
            });
        }
        attachInstructorListener();
    }, 0);
    return html;
}

sections['instructor-schedule-link'] = renderInstructorSchedule;

// Attach instructor select listener
function attachInstructorListener() {
    const select = document.getElementById('instructor-select');
    if (select) {
        select.addEventListener('change', function() {
            selectedInstructor = this.value;
            mainContent.innerHTML = renderInstructorSchedule();
            attachInstructorListener();
        });
    }
}

sections['dashboard-link'] = function renderDashboard() {
    // Count stats from loaded data
    let teachers = 0, courses = 0, rooms = 0;
    // Teachers
    if (excelSheets.instructors && excelSheets.instructors.length > 1) {
        const headers = excelSheets.instructors[0];
        const instructorIdx = headers.findIndex(h => h && h.toLowerCase().includes('instructor'));
        if (instructorIdx !== -1) {
            teachers = new Set(excelSheets.instructors.slice(1).map(r => r[instructorIdx]).filter(Boolean)).size;
        }
    }
    // Courses
    if (excelSheets.subjects && excelSheets.subjects.length > 1) {
        const headers = excelSheets.subjects[0];
        const codeIdx = headers.findIndex(h => h && h.toLowerCase().includes('subject code'));
        if (codeIdx !== -1) {
            courses = new Set(excelSheets.subjects.slice(1).map(r => r[codeIdx]).filter(Boolean)).size;
        }
    }
    // Rooms
    if (excelSheets.rooms && excelSheets.rooms.length > 1) {
        const headers = excelSheets.rooms[0];
        const roomIdx = headers.findIndex(h => h && h.toLowerCase().includes('room'));
        if (roomIdx !== -1) {
            rooms = new Set(excelSheets.rooms.slice(1).map(r => r[roomIdx]).filter(Boolean)).size;
        }
    }
    // For schedules, count mapping rows if available
    let schedules = 0;
    if (excelSheets.mapping && excelSheets.mapping.length > 1) {
        schedules = excelSheets.mapping.length - 1;
    }
    let html = `<div class="dashboard-title">Dashboard</div>`;
    html += `<div class="dashboard-cards">
        <div class="dashboard-card">
            <span class="card-icon">` +
                `<svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path fill="#6c63ff" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5s-3 1.34-3 3 1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05C16.64 13.36 19 14.28 19 15.5V19h5v-2.5c0-2.33-4.67-3.5-7-3.5Z"/></svg>` +
            `</span>
            <div class="card-number">${teachers}</div>
            <div class="card-label">Total Teachers</div>
        </div>
        <div class="dashboard-card">
            <span class="card-icon">` +
                `<svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path fill="#6c63ff" d="M19 2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm0 18H8V4h11v16ZM6 6H4v2h2V6Zm0 4H4v2h2v-2Zm0 4H4v2h2v-2Zm0 4H4v2h2v-2Z"/></svg>` +
            `</span>
            <div class="card-number">${courses}</div>
            <div class="card-label">Total Courses</div>
        </div>
        <div class="dashboard-card">
            <span class="card-icon">` +
                `<svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path fill="#6c63ff" d="M20 19V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2Zm-2 0H6V5h12v14ZM8 7h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z"/></svg>` +
            `</span>
            <div class="card-number">${rooms}</div>
            <div class="card-label">Available Rooms</div>
        </div>
        <div class="dashboard-card">
            <span class="card-icon">` +
                `<svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path fill="#6c63ff" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 18H5V8h14v13Zm0-15H5V5h14v1Z"/><path fill="#6c63ff" d="M7 10h5v5H7z"/></svg>` +
            `</span>
            <div class="card-number">${schedules}</div>
            <div class="card-label">Active Schedules</div>
        </div>
    </div>`;
    html += `<div class="dashboard-title" style="font-size:1.3em;margin-bottom:18px;margin-top:8px;">Quick Actions</div>`;
    html += `<div class="dashboard-cards" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom:0;">
        <button class="dashboard-card dashboard-quick-btn" data-link="teachers-link" style="align-items:center;flex-direction:row;gap:18px;">
            <span class="card-icon">` +
                `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5s-3 1.34-3 3 1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05C16.64 13.36 19 14.28 19 15.5V19h5v-2.5c0-2.33-4.67-3.5-7-3.5Z"/></svg>` +
            `</span>
            <span class="card-label" style="color:#fff;font-size:1.13em;">Manage Teachers</span>
        </button>
        <button class="dashboard-card dashboard-quick-btn" data-link="students-link" style="align-items:center;flex-direction:row;gap:18px;">
            <span class="card-icon">` +
                `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"/></svg>` +
            `</span>
            <span class="card-label" style="color:#fff;font-size:1.13em;">Manage Students</span>
        </button>
        <button class="dashboard-card dashboard-quick-btn" data-link="rooms-link" style="align-items:center;flex-direction:row;gap:18px;">
            <span class="card-icon">` +
                `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M20 19V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2Zm-2 0H6V5h12v14ZM8 7h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z"/></svg>` +
            `</span>
            <span class="card-label" style="color:#fff;font-size:1.13em;">Manage Rooms</span>
        </button>
        <button class="dashboard-card dashboard-quick-btn" data-link="courses-link" style="align-items:center;flex-direction:row;gap:18px;">
            <span class="card-icon">` +
                `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M19 2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm0 18H8V4h11v16ZM6 6H4v2h2V6Zm0 4H4v2h2v-2Zm0 4H4v2h2v-2Zm0 4H4v2h2v-2Z"/></svg>` +
            `</span>
            <span class="card-label" style="color:#fff;font-size:1.13em;">Manage Courses</span>
        </button>
        <button class="dashboard-card dashboard-quick-btn" data-link="scheduler-link" style="align-items:center;flex-direction:row;gap:18px;">
            <span class="card-icon">` +
                `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/><rect x="7" y="9" width="2" height="2" fill="#6c63ff"/><rect x="11" y="9" width="2" height="2" fill="#6c63ff"/><rect x="15" y="9" width="2" height="2" fill="#6c63ff"/><rect x="7" y="13" width="2" height="2" fill="#6c63ff"/><rect x="11" y="13" width="2" height="2" fill="#6c63ff"/><rect x="15" y="13" width="2" height="2" fill="#6c63ff"/></svg>` +
            `</span>
            <span class="card-label" style="color:#fff;font-size:1.13em;">View/Edit Scheduler</span>
        </button>
        <button class="dashboard-card dashboard-quick-btn" data-link="auto-generate-link" style="align-items:center;flex-direction:row;gap:18px;">
            <span class="card-icon">` +
                `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="#fff"/><path d="M8 12h8M12 8v8" stroke="#6c63ff" stroke-width="2" stroke-linecap="round"/></svg>` +
            `</span>
            <span class="card-label" style="color:#fff;font-size:1.13em;">Auto Generate Schedule</span>
        </button>
        <button class="dashboard-card dashboard-quick-btn" data-link="instructor-schedule-link" style="align-items:center;flex-direction:row;gap:18px;">
            <span class="card-icon">` +
                `<svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><rect x="6" y="14" width="12" height="6" rx="3" fill="#6c63ff"/></svg>` +
            `</span>
            <span class="card-label" style="color:#fff;font-size:1.13em;">Instructor Schedule</span>
        </button>
    </div>`;
    // Add event listeners for quick action buttons after rendering
    setTimeout(() => {
        document.querySelectorAll('.dashboard-quick-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const linkId = this.getAttribute('data-link');
                const sidebarLink = document.getElementById(linkId);
                if (sidebarLink) {
                    sidebarLink.click();
                } else {
                    // Fallback: try to find by href
                    const altLink = document.querySelector(`[href='#${linkId}']`);
                    if (altLink) altLink.click();
                }
            });
        });
    }, 0);
    return html;
};

// Helper: parse time in both formats: "7:00 am - 7:00 pm" or "7:00-19:00"
function parseTimeRange(timeStr) {
    if (!timeStr) {
        console.log('parseTimeRange: Empty time string');
        return null;
    }
    console.log('parseTimeRange: Parsing', timeStr);
    
    // Try first format: "7:00 am - 7:00 pm" or "7:00 AM - 7:00 PM"
    let match = timeStr.match(/(\d{1,2}):(\d{2})\s(am|pm|AM|PM)?\s-\s(\d{1,2}):(\d{2})\s(am|pm|AM|PM)?/i);
    if (match) {
        console.log('parseTimeRange: Matched AM/PM format', match);
        let [, h1, m1, ampm1, h2, m2, ampm2] = match;
        h1 = parseInt(h1, 10);
        m1 = parseInt(m1, 10);
        h2 = parseInt(h2, 10);
        m2 = parseInt(m2, 10);
        
        // Convert to 24-hour format if am/pm is specified
        if (ampm1) {
            ampm1 = ampm1.toLowerCase();
            if (ampm1 === 'pm' && h1 < 12) h1 += 12;
            if (ampm1 === 'am' && h1 === 12) h1 = 0;
        }
        if (ampm2) {
            ampm2 = ampm2.toLowerCase();
            if (ampm2 === 'pm' && h2 < 12) h2 += 12;
            if (ampm2 === 'am' && h2 === 12) h2 = 0;
        }
        
        const result = {
            startHour: h1,
            startMinute: m1,
            endHour: h2,
            endMinute: m2,
            startMinutes: h1 * 60 + m1,
            endMinutes: h2 * 60 + m2
        };
        console.log('parseTimeRange: Parsed result', result);
        return result;
    }
    
    // Try second format: "7:00-19:00" or "15:00-16:00"
    match = timeStr.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (match) {
        console.log('parseTimeRange: Matched 24hr format', match);
        let [, h1, m1, h2, m2] = match;
        h1 = parseInt(h1, 10);
        m1 = parseInt(m1, 10);
        h2 = parseInt(h2, 10);
        m2 = parseInt(m2, 10);
        const result = {
            startHour: h1,
            startMinute: m1,
            endHour: h2,
            endMinute: m2,
            startMinutes: h1 * 60 + m1,
            endMinutes: h2 * 60 + m2
        };
        console.log('parseTimeRange: Parsed result', result);
        return result;
    }
    
    console.log('parseTimeRange: Failed to parse time string');
    return null;
}

// Helper function to expand day ranges
function expandDayRange(dayRange) {
    if (!dayRange) return [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // If it's a single day, return it
    if (days.includes(dayRange)) return [dayRange];
    
    // Try to parse range (e.g., "Monday - Friday")
    const [start, end] = dayRange.split('-').map(d => d.trim());
    const startIdx = days.indexOf(start);
    const endIdx = days.indexOf(end);
    
    if (startIdx === -1 || endIdx === -1) return [];
    return days.slice(startIdx, endIdx + 1);
}

// Function to process instructor data
function processInstructorData(instructorRows) {
    console.log('Processing instructor rows:', instructorRows);
    let instructorAvailability = {};
    
    // First, get all unique specializations from the subjects sheet
    const specializations = new Set();
    if (excelSheets.subjects && excelSheets.subjects.length > 1) {
        const specIdx = 2; // Required Specialization column
        excelSheets.subjects.slice(1).forEach(row => {
            if (row[specIdx]) specializations.add(row[specIdx]);
        });
    }
    
    // Process each instructor's availability
    instructorRows.forEach(row => {
        if (!row || row.length < 3) return;
        
        const instructor = row[0]; // Instructor name
        if (!instructor) return;
        
        // Get instructor's specialization
        let specialization = row[4] || 'General'; // Default to General if not specified
        
        // Get day and time slot
        const day = row[1];
        const timeSlot = row[2];
        
        if (!day || !timeSlot) return;
        
        const parsed = parseTimeRange(timeSlot);
        if (!parsed) {
            console.log('Failed to parse time slot:', timeSlot);
            return;
        }
        
        // Handle both single days and day ranges
        const days = expandDayRange(day);
        console.log('Expanded days:', days);
        
        // Add availability for each specialization this instructor can teach
        specializations.forEach(spec => {
            if (!instructorAvailability[spec]) {
                instructorAvailability[spec] = [];
            }
            
            days.forEach(singleDay => {
                instructorAvailability[spec].push({
                    instructor,
                    day: singleDay,
                    start: parsed.startMinutes,
                    end: parsed.endMinutes,
                    slotLabel: timeSlot
                });
            });
        });
    });
    
    return instructorAvailability;
}

// Function to generate section-based schedules automatically
function generateSectionSchedules() {
    if (!excelSheets.instructors || !excelSheets.rooms || !excelSheets.students || !excelSheets.subjects) {
        document.getElementById('generation-results').innerHTML = '<div class="error-message">Missing required data. Please make sure all sheets are loaded.</div>';
        return;
    }
    
    const results = document.getElementById('generation-results');
    results.innerHTML = '<div>Generating section schedules...</div>';
    
    try {
        // Build instructor availability lookup: { specialization: [ { instructor, day, start, end, slotLabel } ] }
        const instructorRows = excelSheets.instructors.slice(1);
        const instrNameIdx = 0;
        const dayIdx = 1;
        const timeIdx = 2;
        const specIdx = 4; // Specialization
        let instructorAvailability = {};
        instructorRows.forEach(row => {
            const instructor = row[instrNameIdx];
            const day = row[dayIdx];
            const timeSlot = row[timeIdx];
            const specialization = row[specIdx];
            if (!instructor || !day || !timeSlot || !specialization) return;
            const parsed = parseTimeRange(timeSlot);
            if (!parsed) return;
            if (!instructorAvailability[specialization]) instructorAvailability[specialization] = [];
            instructorAvailability[specialization].push({ instructor, day, start: parsed.startMinutes, end: parsed.endMinutes, slotLabel: timeSlot });
        });
        
        // Build room availability lookup: { day: [ { room, start, end, slotLabel, capacity } ] }
        const roomRows = excelSheets.rooms.slice(1);
        const roomNameIdx = 0;
        const roomDayIdx = 1;
        const roomTimeIdx = 2;
        const capIdx = 3;
        let roomAvailability = {};
        roomRows.forEach(row => {
            const room = row[roomNameIdx];
            const day = row[roomDayIdx];
            const timeSlot = row[roomTimeIdx];
            const capacity = parseInt(row[capIdx], 10) || 0;
            if (!room || !day || !timeSlot) return;
            const parsed = parseTimeRange(timeSlot);
            if (!parsed) return;
            if (!roomAvailability[day]) roomAvailability[day] = [];
            roomAvailability[day].push({ room, start: parsed.startMinutes, end: parsed.endMinutes, slotLabel: timeSlot, capacity });
        });
        
        // Get student sections
        const studentsRows = excelSheets.students.slice(1);
        const sectionIdx = 2;
        const courseIdx = 0;
        const yearIdx = 1;
        const studentsCountIdx = 3;
        const sections = studentsRows.map(r => r[sectionIdx]).filter(Boolean);
        
        // Get subjects
        const subjectRows = excelSheets.subjects.slice(1);
        const subjCodeIdx = 0;
        const subjNameIdx = 1;
        const subjSpecIdx = 2;
        
        // Prepare stats
        const schedulesGenerated = [];
        const generationStats = {
            sectionsProcessed: 0,
            sectionsWithSchedules: 0,
            totalAssignments: 0,
            subjectsAssigned: 0,
            failedAssignments: 0,
            roomsUsed: new Set(),
            instructorsAssigned: new Set()
        };
        
        // Track teacher assignments: { instructor: { day: [ { start, end } ] } }
        let teacherAssignments = {};
        // Track room assignments: { room: { day: [ { start, end } ] } }
        let roomAssignments = {};
        
        for (const section of sections) {
            generationStats.sectionsProcessed++;
            const sectionInfo = studentsRows.find(r => r[sectionIdx] === section);
            const course = sectionInfo ? sectionInfo[courseIdx] : '';
            const year = sectionInfo ? sectionInfo[yearIdx] : '';
            const studentCount = sectionInfo && sectionInfo[studentsCountIdx] ? parseInt(sectionInfo[studentsCountIdx], 10) : 40;
            // For now, assign all subjects to all sections
            const sectionSubjects = subjectRows;
            const sectionSchedule = [];
            for (const subject of sectionSubjects) {
                generationStats.subjectsAssigned++;
                const subjectCode = subject[subjCodeIdx];
                const subjectTitle = subject[subjNameIdx];
                const requiredSpec = subject[subjSpecIdx];
                // Find all available instructors for this specialization
                const availableInstructors = instructorAvailability[requiredSpec] || [];
                let assigned = false;
                // Try every available instructor slot for this specialization
                for (const instrSlot of availableInstructors) {
                    // Check if this instructor is already assigned at this day/time
                    if (!teacherAssignments[instrSlot.instructor]) teacherAssignments[instrSlot.instructor] = {};
                    if (!teacherAssignments[instrSlot.instructor][instrSlot.day]) teacherAssignments[instrSlot.instructor][instrSlot.day] = [];
                    // Check for overlap
                    const hasConflict = teacherAssignments[instrSlot.instructor][instrSlot.day].some(a =>
                        (instrSlot.start < a.end && instrSlot.end > a.start)
                    );
                    if (hasConflict) continue; // Skip if conflict
                    // For this instructor, day, and time, find a matching room with the exact same slot
                    const possibleRooms = (roomAvailability[instrSlot.day] || []).filter(roomSlot =>
                        roomSlot.start === instrSlot.start &&
                        roomSlot.end === instrSlot.end &&
                        roomSlot.capacity >= studentCount
                    );
                    let foundRoom = null;
                    for (const room of possibleRooms) {
                        // Check if this room is already assigned at this day/time
                        if (!roomAssignments[room.room]) roomAssignments[room.room] = {};
                        if (!roomAssignments[room.room][instrSlot.day]) roomAssignments[room.room][instrSlot.day] = [];
                        // Check for overlap
                        const hasRoomConflict = roomAssignments[room.room][instrSlot.day].some(a =>
                            (instrSlot.start < a.end && instrSlot.end > a.start)
                        );
                        if (!hasRoomConflict) {
                            foundRoom = room;
                            break;
                        }
                    }
                    if (foundRoom) {
                        sectionSchedule.push({
                            section,
                            course,
                            year,
                            subjectCode,
                            subjectTitle,
                            instructor: instrSlot.instructor,
                            room: foundRoom.room,
                            day: instrSlot.day,
                            timeSlot: instrSlot.slotLabel
                        });
                        generationStats.totalAssignments++;
                        generationStats.roomsUsed.add(foundRoom.room);
                        generationStats.instructorsAssigned.add(instrSlot.instructor);
                        // Mark this instructor as assigned for this slot
                        teacherAssignments[instrSlot.instructor][instrSlot.day].push({ start: instrSlot.start, end: instrSlot.end });
                        // Mark this room as assigned for this slot
                        roomAssignments[foundRoom.room][instrSlot.day].push({ start: instrSlot.start, end: instrSlot.end });
                        assigned = true;
                        break;
                    }
                }
                if (!assigned) {
                    generationStats.failedAssignments++;
                }
            }
            if (sectionSchedule.length > 0) {
                schedulesGenerated.push({ section, schedule: sectionSchedule });
                generationStats.sectionsWithSchedules++;
            }
        }
        // Create mapping sheet from generated schedules
        const mappingRows = [
            ['Section', 'Course', 'Year', 'Subject Code', 'Subject Name', 'Instructor', 'Room', 'Day', 'Time']
        ];
        schedulesGenerated.forEach(sec => {
            sec.schedule.forEach(entry => {
                mappingRows.push([
                    entry.section,
                    entry.course,
                    entry.year,
                    entry.subjectCode,
                    entry.subjectTitle,
                    entry.instructor,
                    entry.room,
                    entry.day,
                    entry.timeSlot
                ]);
            });
        });
        excelSheets.mapping = mappingRows;
        if (schedulesGenerated.length === 0) {
            results.innerHTML = '<div class="error-message">No schedules could be generated. Check your data format and try again.</div>';
            return;
        }
        results.innerHTML = '<div class="success-message">Section schedules successfully generated!</div>';
        results.innerHTML += `<div style="margin: 20px 0; background: #f5f9ff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);"><h3 style="margin-top: 0; color: #2c3e50;">Generation Statistics</h3><ul style="padding-left: 20px;"><li><strong>Sections:</strong> ${generationStats.sectionsWithSchedules} of ${generationStats.sectionsProcessed} sections scheduled</li><li><strong>Assignments:</strong> ${generationStats.totalAssignments} classes scheduled (${generationStats.failedAssignments} failed)</li><li><strong>Rooms Used:</strong> ${generationStats.roomsUsed.size} rooms</li><li><strong>Instructors Assigned:</strong> ${generationStats.instructorsAssigned.size} instructors</li></ul></div>`;
        results.innerHTML += '<p>You can now view these schedules in the View/Edit Scheduler and Instructor Schedule tabs.</p>';
        results.innerHTML += `<div style="display: flex; gap: 15px; margin-top: 15px;"><button id="view-schedules-btn" class="dashboard-card dashboard-quick-btn" style="display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;"><span class="card-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/><rect x="7" y="9" width="2" height="2" fill="#6c63ff"/><rect x="11" y="9" width="2" height="2" fill="#6c63ff"/><rect x="15" y="9" width="2" height="2" fill="#6c63ff"/><rect x="7" y="13" width="2" height="2" fill="#6c63ff"/><rect x="11" y="13" width="2" height="2" fill="#6c63ff"/><rect x="15" y="13" width="2" height="2" fill="#6c63ff"/></svg></span><span class="card-label" style="color:#fff; font-size:1em;">View Section Schedules</span></button><button id="view-instructor-btn" class="dashboard-card dashboard-quick-btn" style="display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;"><span class="card-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><rect x="6" y="14" width="12" height="6" rx="3" fill="#6c63ff"/></svg></span><span class="card-label" style="color:#fff; font-size:1em;">View Instructor Schedules</span></button></div>`;
        setTimeout(() => {
            const viewSchedulesBtn = document.getElementById('view-schedules-btn');
            if (viewSchedulesBtn) {
                viewSchedulesBtn.addEventListener('click', function() {
                    const schedulerLink = document.getElementById('scheduler-link');
                    if (schedulerLink) {
                        schedulerLink.click();
                        // Force refresh the scheduler view
                        setTimeout(() => {
                            mainContent.innerHTML = renderScheduler();
                            attachSectionListener();
                        }, 100);
                    }
                });
            }
            const viewInstructorBtn = document.getElementById('view-instructor-btn');
            if (viewInstructorBtn) {
                viewInstructorBtn.addEventListener('click', function() {
                    const instructorLink = document.getElementById('instructor-schedule-link');
                    if (instructorLink) {
                        instructorLink.click();
                    }
                });
            }
        }, 0);
    } catch (error) {
        results.innerHTML = '<div class="error-message">Error generating schedules: ' + error.message + '</div>';
        console.error('Schedule generation error:', error);
    }
}

// Function to generate instructor schedules
function generateInstructorSchedules() {
    const results = document.getElementById('generation-results');
    
    if (!excelSheets.mapping) {
        // First generate section schedules if not already done
        results.innerHTML = '<div class="error-message">No schedule data available. First generate section schedules.</div>';
        results.innerHTML += `
            <button id="generate-section-first-btn" class="dashboard-card dashboard-quick-btn" style="margin-top: 15px; display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
                <span class="card-label" style="color:#fff; font-size:1em;">Generate Section Schedules</span>
            </button>
        `;
        
        // Add listener for the generate button
        setTimeout(() => {
            const generateBtn = document.getElementById('generate-section-first-btn');
            if (generateBtn) {
                generateBtn.addEventListener('click', function() {
                    generateSectionSchedules();
                });
            }
        }, 0);
        
        return;
    }
    
    try {
        // Parse the mapping data to get instructor assignments
        const mappingHeaders = excelSheets.mapping[0];
        const mappingRows = excelSheets.mapping.slice(1);
        
        // Find column indices
        const instrIdx = mappingHeaders.findIndex(h => h && h.toLowerCase().includes('instructor'));
        const sectionIdx = mappingHeaders.findIndex(h => h && h.toLowerCase().includes('section'));
        const subjectIdx = mappingHeaders.findIndex(h => h && (h.toLowerCase().includes('subject name') || h.toLowerCase().includes('subject')));
        const dayIdx = mappingHeaders.findIndex(h => h && h.toLowerCase() === 'day');
        const timeIdx = mappingHeaders.findIndex(h => h && h.toLowerCase().includes('time'));
        const roomIdx = mappingHeaders.findIndex(h => h && h.toLowerCase().includes('room'));
        
        if (instrIdx === -1 || sectionIdx === -1 || subjectIdx === -1 || dayIdx === -1 || timeIdx === -1 || roomIdx === -1) {
            results.innerHTML = '<div class="error-message">Invalid mapping data. Some required columns are missing.</div>';
            return;
        }
        
        // Get all unique instructors and their assignments
        const instructors = new Set();
        mappingRows.forEach(row => {
            if (row[instrIdx]) {
                instructors.add(row[instrIdx]);
            }
        });
        
        if (instructors.size === 0) {
            results.innerHTML = '<div class="error-message">No instructor assignments found in the schedule data.</div>';
            return;
        }
        
        // Count assignments per instructor
        const instructorStats = {};
        instructors.forEach(instructor => {
            const assignments = mappingRows.filter(row => row[instrIdx] === instructor);
            
            // Count by day
            const dayCount = {};
            assignments.forEach(assignment => {
                const day = assignment[dayIdx];
                if (!day) return;
                
                dayCount[day] = (dayCount[day] || 0) + 1;
            });
            
            // Count unique sections taught
            const sections = new Set();
            assignments.forEach(assignment => {
                if (assignment[sectionIdx]) {
                    sections.add(assignment[sectionIdx]);
                }
            });
            
            // Count unique subjects taught
            const subjects = new Set();
            assignments.forEach(assignment => {
                if (assignment[subjectIdx]) {
                    subjects.add(assignment[subjectIdx]);
                }
            });
            
            instructorStats[instructor] = {
                totalAssignments: assignments.length,
                dayCount,
                sections: sections.size,
                subjects: subjects.size
            };
        });
        
        // Display success message
        results.innerHTML = '<div class="success-message">Instructor schedules are ready!</div>';
        
        // Generate statistics
        results.innerHTML += `
            <div style="margin: 20px 0; background: #f5f9ff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #2c3e50;">Instructor Assignment Statistics</h3>
                <p>Total Instructors: ${instructors.size}</p>
                <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e3f2fd; text-align: left;">
                                <th style="padding: 8px; border: 1px solid #cfd8dc;">Instructor</th>
                                <th style="padding: 8px; border: 1px solid #cfd8dc;">Classes</th>
                                <th style="padding: 8px; border: 1px solid #cfd8dc;">Sections</th>
                                <th style="padding: 8px; border: 1px solid #cfd8dc;">Subjects</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Sort instructors by number of assignments
        const sortedInstructors = Array.from(instructors).sort((a, b) => {
            return instructorStats[b].totalAssignments - instructorStats[a].totalAssignments;
        });
        
        sortedInstructors.forEach(instructor => {
            const stats = instructorStats[instructor];
            results.innerHTML += `
                <tr style="border-bottom: 1px solid #eceff1;">
                    <td style="padding: 8px; border: 1px solid #cfd8dc;">${instructor}</td>
                    <td style="padding: 8px; border: 1px solid #cfd8dc;">${stats.totalAssignments}</td>
                    <td style="padding: 8px; border: 1px solid #cfd8dc;">${stats.sections}</td>
                    <td style="padding: 8px; border: 1px solid #cfd8dc;">${stats.subjects}</td>
                </tr>
            `;
        });
        
        results.innerHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        results.innerHTML += '<p>You can view detailed instructor schedules in the Instructor Schedule tab.</p>';
        
        // Add button to view instructor schedules
        results.innerHTML += `
            <button id="view-instructor-schedules-btn" class="dashboard-card dashboard-quick-btn" style="margin-top: 15px; display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
                <span class="card-icon">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><rect x="6" y="14" width="12" height="6" rx="3" fill="#6c63ff"/></svg>
                </span>
                <span class="card-label" style="color:#fff; font-size:1em;">View Instructor Schedules</span>
            </button>
        `;
        
        // Add listener for the view schedules button
        setTimeout(() => {
            const viewSchedulesBtn = document.getElementById('view-instructor-schedules-btn');
            if (viewSchedulesBtn) {
                viewSchedulesBtn.addEventListener('click', function() {
                    const instructorLink = document.getElementById('instructor-schedule-link');
                    if (instructorLink) {
                        instructorLink.click();
                    }
                });
            }
        }, 0);
    } catch (error) {
        results.innerHTML = '<div class="error-message">Error generating instructor schedules: ' + error.message + '</div>';
        console.error('Instructor schedule generation error:', error);
    }
}

// Add new function for smart schedule format
function processSmartInstructorData(instructorRows) {
    console.log('Processing smart format instructor rows:', instructorRows);
    let instructorAvailability = {};
    
    // First, get all unique specializations from the subjects sheet
    const specializations = new Set();
    if (excelSheets.subjects && excelSheets.subjects.length > 1) {
        const specIdx = 2; // Required Specialization column
        excelSheets.subjects.slice(1).forEach(row => {
            if (row[specIdx]) specializations.add(row[specIdx]);
        });
    }
    
    // Process each instructor's availability
    instructorRows.forEach(row => {
        if (!row || row.length < 3) return;
        
        const instructor = row[0]; // Instructor name
        if (!instructor) return;
        
        // Get instructor's specialization
        let specialization = row[4] || 'General'; // Default to General if not specified
        
        // Get day and time slot
        const day = row[1];
        const timeSlot = row[2];
        
        if (!day || !timeSlot) return;
        
        const parsed = parseTimeRange(timeSlot);
        if (!parsed) {
            console.log('Failed to parse time slot:', timeSlot);
            return;
        }
        
        // Handle both single days and day ranges
        const days = expandDayRange(day);
        console.log('Expanded days:', days);
        
        // Add availability for each specialization this instructor can teach
        specializations.forEach(spec => {
            if (!instructorAvailability[spec]) {
                instructorAvailability[spec] = [];
            }
            
            days.forEach(singleDay => {
                instructorAvailability[spec].push({
                    instructor,
                    day: singleDay,
                    start: parsed.startMinutes,
                    end: parsed.endMinutes,
                    slotLabel: timeSlot
                });
            });
        });
    });
    
    return instructorAvailability;
}

// Update generateSmartSchedule to use the new format
function generateSmartSchedule() {
    if (!excelSheets.instructors || !excelSheets.rooms || !excelSheets.students || !excelSheets.subjects) {
        document.getElementById('generation-results').innerHTML = '<div class="error-message">Missing required data. Please make sure all sheets are loaded.</div>';
        return;
    }
    
    const results = document.getElementById('generation-results');
    results.innerHTML = '<div>Generating smart schedules...</div>';
    
    try {
        // Use the new smart format processor
        const instructorRows = excelSheets.instructors.slice(1);
        let instructorAvailability = processSmartInstructorData(instructorRows);
        
        // Build room availability lookup
        const roomRows = excelSheets.rooms.slice(1);
        const roomNameIdx = 0;
        const roomDayIdx = 1;
        const roomTimeIdx = 2;
        const capIdx = 3;
        let roomAvailability = {};
        roomRows.forEach(row => {
            const room = row[roomNameIdx];
            const day = row[roomDayIdx];
            const timeSlot = row[roomTimeIdx];
            const capacity = parseInt(row[capIdx], 10) || 0;
            if (!room || !day || !timeSlot) return;
            const parsed = parseTimeRange(timeSlot);
            if (!parsed) return;
            if (!roomAvailability[day]) roomAvailability[day] = [];
            roomAvailability[day].push({ room, start: parsed.startMinutes, end: parsed.endMinutes, slotLabel: timeSlot, capacity });
        });
        
        // Get student sections
        const studentsRows = excelSheets.students.slice(1);
        const sectionIdx = 2; // Section column
        const courseIdx = 0; // Course column
        const yearIdx = 1;  // Year Level column
        const studentsCountIdx = 3; // Students column
        
        // Get unique sections and their details
        const sections = [];
        studentsRows.forEach(row => {
            if (row[sectionIdx] && row[courseIdx] && row[yearIdx]) {
                sections.push({
                    section: row[sectionIdx],
                    course: row[courseIdx],
                    year: row[yearIdx],
                    studentCount: row[studentsCountIdx] ? parseInt(row[studentsCountIdx], 10) : 40
                });
            }
        });
        
        // Get subjects with their details
        const subjectRows = excelSheets.subjects.slice(1);
        const subjCodeIdx = 0; // Subject Code column
        const subjNameIdx = 1; // Subject Name column
        const subjSpecIdx = 2; // Required Specialization column
        const subjCreditIdx = 3; // Credit Units column
        
        // Initialize tracking variables
        const schedulesGenerated = [];
        const generationStats = {
            sectionsProcessed: 0,
            sectionsWithSchedules: 0,
            totalAssignments: 0,
            subjectsAssigned: 0,
            failedAssignments: 0,
            roomsUsed: new Set(),
            instructorsAssigned: new Set()
        };
        
        let teacherAssignments = {};
        let roomAssignments = {};
        let sectionDayUsage = {};
        let sectionTimeUsage = {};
        
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        // Process each section
        for (const sectionInfo of sections) {
            generationStats.sectionsProcessed++;
            const { section, course, year, studentCount } = sectionInfo;
            
            // Initialize section tracking
            sectionDayUsage[section] = {};
            sectionTimeUsage[section] = {};
            validDays.forEach(day => {
                sectionDayUsage[section][day] = 0;
                sectionTimeUsage[section][day] = [];
            });
            
            // Get subjects for this course and year
            const sectionSubjects = subjectRows.filter(subject => {
                const subjectCourse = subject[3]; // Course column in subjects
                const subjectYear = subject[4];   // Year Level column in subjects
                return (!subjectCourse || subjectCourse === course) && 
                       (!subjectYear || parseInt(subjectYear) === parseInt(year));
            });
            
            const sectionSchedule = [];
            const shuffledSubjects = [...sectionSubjects].sort(() => Math.random() - 0.5);
            
            for (const subject of shuffledSubjects) {
                generationStats.subjectsAssigned++;
                const subjectCode = subject[subjCodeIdx];
                const subjectTitle = subject[subjNameIdx];
                const requiredSpec = subject[subjSpecIdx];
                
                const availableInstructors = instructorAvailability[requiredSpec] || [];
                let assigned = false;
                
                const currentDayCount = Object.values(sectionDayUsage[section]).filter(count => count > 0).length;
                
                const sortedDays = [...validDays].sort((a, b) => {
                    const aCount = sectionDayUsage[section][a] || 0;
                    const bCount = sectionDayUsage[section][b] || 0;
                    if (currentDayCount < 4) {
                        return aCount - bCount;
                    } else {
                        return bCount - aCount;
                    }
                });
                
                for (const day of sortedDays) {
                    if (currentDayCount >= 5 && !sectionDayUsage[section][day]) continue;
                    
                    const dayInstructors = availableInstructors.filter(slot => slot.day === day);
                    
                    dayInstructors.sort((a, b) => {
                        const aConflicts = sectionTimeUsage[section][day].filter(time =>
                            (time.start <= a.end && time.end >= a.start)
                        ).length;
                        const bConflicts = sectionTimeUsage[section][day].filter(time =>
                            (time.start <= b.end && time.end >= b.start)
                        ).length;
                        return aConflicts - bConflicts;
                    });
                    
                    for (const instrSlot of dayInstructors) {
                        if (!teacherAssignments[instrSlot.instructor]) {
                            teacherAssignments[instrSlot.instructor] = {};
                        }
                        if (!teacherAssignments[instrSlot.instructor][day]) {
                            teacherAssignments[instrSlot.instructor][day] = [];
                        }
                        
                        const hasConflict = teacherAssignments[instrSlot.instructor][day].some(a =>
                            (instrSlot.start < a.end && instrSlot.end > a.start)
                        );
                        if (hasConflict) continue;
                        
                        const hasTimeConflict = sectionTimeUsage[section][day].some(time =>
                            (instrSlot.start < time.end && instrSlot.end > time.start)
                        );
                        if (hasTimeConflict) continue;
                        
                        const possibleRooms = (roomAvailability[day] || []).filter(roomSlot =>
                            roomSlot.start === instrSlot.start &&
                            roomSlot.end === instrSlot.end &&
                            roomSlot.capacity >= studentCount
                        );
                        
                        let foundRoom = null;
                        for (const room of possibleRooms) {
                            if (!roomAssignments[room.room]) {
                                roomAssignments[room.room] = {};
                            }
                            if (!roomAssignments[room.room][day]) {
                                roomAssignments[room.room][day] = [];
                            }
                            
                            const hasRoomConflict = roomAssignments[room.room][day].some(a =>
                                (instrSlot.start < a.end && instrSlot.end > a.start)
                            );
                            if (!hasRoomConflict) {
                                foundRoom = room;
                                break;
                            }
                        }
                        
                        if (foundRoom) {
                            sectionSchedule.push({
                                section,
                                course,
                                year,
                                subjectCode,
                                subjectTitle,
                                instructor: instrSlot.instructor,
                                room: foundRoom.room,
                                day,
                                timeSlot: instrSlot.slotLabel
                            });
                            
                            sectionDayUsage[section][day]++;
                            sectionTimeUsage[section][day].push({
                                start: instrSlot.start,
                                end: instrSlot.end
                            });
                            
                            teacherAssignments[instrSlot.instructor][day].push({
                                start: instrSlot.start,
                                end: instrSlot.end
                            });
                            
                            roomAssignments[foundRoom.room][day].push({
                                start: instrSlot.start,
                                end: instrSlot.end
                            });
                            
                            generationStats.totalAssignments++;
                            generationStats.roomsUsed.add(foundRoom.room);
                            generationStats.instructorsAssigned.add(instrSlot.instructor);
                            
                            assigned = true;
                            break;
                        }

                    }
                    
                    if (assigned) break;
                }
                
                if (!assigned) {
                    generationStats.failedAssignments++;
                }
            }
            
            if (sectionSchedule.length > 0) {
                schedulesGenerated.push({ section, schedule: sectionSchedule });
                generationStats.sectionsWithSchedules++;
            }
        }
        
        // Create mapping sheet from generated schedules
        const mappingRows = [
            ['Section', 'Course', 'Year', 'Subject Code', 'Subject Name', 'Instructor', 'Room', 'Day', 'Time']
        ];
        
        schedulesGenerated.forEach(sec => {
            sec.schedule.forEach(entry => {
                mappingRows.push([
                    entry.section,
                    entry.course,
                    entry.year,
                    entry.subjectCode,
                    entry.subjectTitle,
                    entry.instructor,
                    entry.room,
                    entry.day,
                    entry.timeSlot
                ]);
            });
        });
        
        // Store as smart mapping while preserving original mapping
        excelSheets.smartMapping = mappingRows;
        
        if (schedulesGenerated.length === 0) {
            results.innerHTML = '<div class="error-message">No schedules could be generated. Check your data format and try again.</div>';
            return;
        }
        
        // Initialize the first section for viewing
        if (mappingRows.length > 1) {
            selectedSection = mappingRows[1][0];
        }
        
        // Set the current mapping type to smart mapping
        window.currentMappingType = 'smartMapping';
        
        // Force refresh the scheduler view
        mainContent.innerHTML = renderScheduler();
        attachSectionListener();
        
        // Show success message and statistics
        results.innerHTML = '<div class="success-message">Smart schedules successfully generated!</div>';
        results.innerHTML += `
            <div style="margin: 20px 0; background: #f5f9ff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #2c3e50;">Generation Statistics</h3>
                <ul style="padding-left: 20px;">
                    <li><strong>Sections:</strong> ${generationStats.sectionsWithSchedules} of ${generationStats.sectionsProcessed} sections scheduled</li>
                    <li><strong>Assignments:</strong> ${generationStats.totalAssignments} classes scheduled (${generationStats.failedAssignments} failed)</li>
                    <li><strong>Rooms Used:</strong> ${generationStats.roomsUsed.size} rooms</li>
                    <li><strong>Instructors Assigned:</strong> ${generationStats.instructorsAssigned.size} instructors</li>
                </ul>
            </div>
        `;
        
        results.innerHTML += '<p>You can now view these schedules in the View/Edit Scheduler and Instructor Schedule tabs.</p>';
        results.innerHTML += `
            <div style="display: flex; gap: 15px; margin-top: 15px;">
                <button id="view-schedules-btn" class="dashboard-card dashboard-quick-btn" style="display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
                    <span class="card-icon">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/><rect x="7" y="9" width="2" height="2" fill="#6c63ff"/><rect x="11" y="9" width="2" height="2" fill="#6c63ff"/><rect x="15" y="9" width="2" height="2" fill="#6c63ff"/><rect x="7" y="13" width="2" height="2" fill="#6c63ff"/><rect x="11" y="13" width="2" height="2" fill="#6c63ff"/><rect x="15" y="13" width="2" height="2" fill="#6c63ff"/></svg>
                    </span>
                    <span class="card-label" style="color:#fff; font-size:1em;">View Section Schedules</span>
                </button>
                <button id="view-instructor-btn" class="dashboard-card dashboard-quick-btn" style="display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
                    <span class="card-icon">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><rect x="6" y="14" width="12" height="6" rx="3" fill="#6c63ff"/></svg>
                    </span>
                    <span class="card-label" style="color:#fff; font-size:1em;">View Instructor Schedules</span>
                </button>
            </div>
        `;
        
        // Add button listeners
        setTimeout(() => {
            const viewSchedulesBtn = document.getElementById('view-schedules-btn');
            if (viewSchedulesBtn) {
                viewSchedulesBtn.addEventListener('click', function() {
                    const schedulerLink = document.getElementById('scheduler-link');
                    if (schedulerLink) {
                        schedulerLink.click();
                    }
                });
            }
            const viewInstructorBtn = document.getElementById('view-instructor-btn');
            if (viewInstructorBtn) {
                viewInstructorBtn.addEventListener('click', function() {
                    const instructorLink = document.getElementById('instructor-schedule-link');
                    if (instructorLink) {
                        instructorLink.click();
                    }
                });
            }
        }, 0);
        
    } catch (error) {
        results.innerHTML = '<div class="error-message">Error generating smart schedules: ' + error.message + '</div>';
        console.error('Smart schedule generation error:', error);
    }
}

// Add new smart schedule generation function for new format
function generateNewFormatSmartSchedule() {
    // Fix the condition check
    if (!excelSheets || excelSheets.format !== 'new' || !excelSheets.instructors || !excelSheets.sections || !excelSheets.subjects || !excelSheets.rooms || !excelSheets.courseAssignments) {
        console.error('[NewFormat] Missing required data for schedule generation');
        return;
    }

    const results = document.getElementById('generation-results');
    results.innerHTML = '<div>Generating smart schedules...</div>';
    
    try {
        console.log('Starting new format smart schedule generation');
        
        // Initialize tracking variables
        const schedulesGenerated = [];
        const generationStats = {
            sectionsProcessed: 0,
            sectionsWithSchedules: 0,
            totalAssignments: 0,
            subjectsAssigned: 0,
            failedAssignments: 0,
            roomsUsed: new Set(),
            instructorsAssigned: new Set()
        };
        
        // Process each section
        for (const section of excelSheets.sections) {
            console.log('Processing section:', section);
            generationStats.sectionsProcessed++;
            
            // Get subjects for this course and year
            const sectionSubjects = excelSheets.subjects.filter(subject => 
                subject.course === section.course && 
                subject.yearLevel === section.yearLevel
            );
            
            const sectionSchedule = [];
            
            // Process each subject
            for (const subject of sectionSubjects) {
                generationStats.subjectsAssigned++;
                
                // Find instructor assignment for this subject
                const assignment = excelSheets.courseAssignments.find(a => 
                    a.course === section.course && 
                    a.subject === subject.code
                );
                
                if (!assignment) {
                    console.log(`No instructor assigned for ${subject.code} in ${section.course}`);
                    generationStats.failedAssignments++;
                    continue;
                }
                
                // Get instructor details
                const instructor = excelSheets.instructors.find(i => i.name === assignment.instructor);
                if (!instructor) {
                    console.log(`Instructor ${assignment.instructor} not found`);
                    generationStats.failedAssignments++;
                    continue;
                }
                
                // Get instructor's available days and time
                const availableDays = instructor.days.split('-').map(d => d.trim());
                const availableTime = instructor.time;
                
                let assigned = false;
                
                // Try each available day
                for (const day of availableDays) {
                    if (assigned) break;
                    
                    // Find available room
                    const availableRooms = excelSheets.rooms.filter(room => {
                        // Check day availability
                        const roomDays = room.days.split('-').map(d => d.trim());
                        if (!roomDays.includes(day)) return false;
                        
                        // Check time slot match
                        if (room.timeSlot !== availableTime) return false;
                        
                        // Check capacity
                        if (room.capacity < section.students) return false;
                        
                        return true;
                    });
                    
                    if (availableRooms.length > 0) {
                        const room = availableRooms[0];
                        sectionSchedule.push({
                            section: section.section,
                            course: section.course,
                            year: section.yearLevel,
                            subjectCode: subject.code,
                            subjectTitle: subject.title,
                            instructor: instructor.name,
                            room: room.room,
                            day,
                            timeSlot: availableTime
                        });
                        
                        generationStats.totalAssignments++;
                        generationStats.roomsUsed.add(room.room);
                        generationStats.instructorsAssigned.add(instructor.name);
                        assigned = true;
                    }
                }
                
                if (!assigned) {
                    generationStats.failedAssignments++;
                    console.log(`Failed to assign ${subject.code} for section ${section.section}`);
                }
            }
            
            if (sectionSchedule.length > 0) {
                schedulesGenerated.push({ section: section.section, schedule: sectionSchedule });
                generationStats.sectionsWithSchedules++;
            }
        }
        
        console.log('Schedules generated:', schedulesGenerated);
        
        // Create mapping sheet from generated schedules
        const mappingRows = [
            ['Section', 'Course', 'Year', 'Subject Code', 'Subject Name', 'Instructor', 'Room', 'Day', 'Time']
        ];
        
        schedulesGenerated.forEach(sec => {
            sec.schedule.forEach(entry => {
                mappingRows.push([
                    entry.section,
                    entry.course,
                    entry.year,
                    entry.subjectCode,
                    entry.subjectTitle,
                    entry.instructor,
                    entry.room,
                    entry.day,
                    entry.timeSlot
                ]);
            });
        });
        
        // Store as smart mapping
        excelSheets.smartMapping = mappingRows;
        
        // Set the current mapping type to smart mapping
        window.currentMappingType = 'smartMapping';
        
        // Force refresh the scheduler view
        mainContent.innerHTML = renderNewFormatScheduler();
        attachSectionListener();
        
        // Show success message and statistics
        results.innerHTML = '<div class="success-message">Smart schedules successfully generated!</div>';
        results.innerHTML += `
            <div style="margin: 20px 0; background: #f5f9ff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #2c3e50;">Generation Statistics</h3>
                <ul style="padding-left: 20px;">
                    <li><strong>Sections:</strong> ${generationStats.sectionsWithSchedules} of ${generationStats.sectionsProcessed} sections scheduled</li>
                    <li><strong>Assignments:</strong> ${generationStats.totalAssignments} classes scheduled (${generationStats.failedAssignments} failed)</li>
                    <li><strong>Rooms Used:</strong> ${generationStats.roomsUsed.size} rooms</li>
                    <li><strong>Instructors Assigned:</strong> ${generationStats.instructorsAssigned.size} instructors</li>
                </ul>
            </div>
        `;
        
        // Add view buttons
        results.innerHTML += `
            <div style="display: flex; gap: 15px; margin-top: 15px;">
                <button id="view-schedules-btn" class="dashboard-card dashboard-quick-btn" style="display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
                    <span class="card-icon">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="#fff"/><rect x="7" y="9" width="2" height="2" fill="#6c63ff"/><rect x="11" y="9" width="2" height="2" fill="#6c63ff"/><rect x="15" y="9" width="2" height="2" fill="#6c63ff"/><rect x="7" y="13" width="2" height="2" fill="#6c63ff"/><rect x="11" y="13" width="2" height="2" fill="#6c63ff"/><rect x="15" y="13" width="2" height="2" fill="#6c63ff"/></svg>
                    </span>
                    <span class="card-label" style="color:#fff; font-size:1em;">View Section Schedules</span>
                </button>
                <button id="view-instructor-btn" class="dashboard-card dashboard-quick-btn" style="display: inline-flex; align-items: center; flex-direction: row; gap: 10px; padding: 10px 20px;">
                    <span class="card-icon">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><rect x="6" y="14" width="12" height="6" rx="3" fill="#6c63ff"/></svg>
                    </span>
                    <span class="card-label" style="color:#fff; font-size:1em;">View Instructor Schedules</span>
                </button>
            </div>
        `;
        
        // Add button listeners
        setTimeout(() => {
            const viewSchedulesBtn = document.getElementById('view-schedules-btn');
            if (viewSchedulesBtn) {
                viewSchedulesBtn.addEventListener('click', function() {
                    const schedulerLink = document.getElementById('scheduler-link');
                    if (schedulerLink) {
                        schedulerLink.click();
                    }
                });
            }
            const viewInstructorBtn = document.getElementById('view-instructor-btn');
            if (viewInstructorBtn) {
                viewInstructorBtn.addEventListener('click', function() {
                    const instructorLink = document.getElementById('instructor-schedule-link');
                    if (instructorLink) {
                        instructorLink.click();
                    }
                });
            }
        }, 0);
        
    } catch (error) {
        results.innerHTML = '<div class="error-message">Error generating smart schedules: ' + error.message + '</div>';
        console.error('Smart schedule generation error:', error);
    }
}

// Modify the generate smart schedule button click handler
document.getElementById('generate-smart-btn').addEventListener('click', function() {
    if (excelSheets.format === 'new') {
        generateNewFormatSmartSchedule();
    } else {
        generateSmartSchedule();
    }
});

// Add new scheduler renderer for new format
function renderNewFormatScheduler() {
    if (!excelSheets || excelSheets.format !== 'new') {
        return '<div class="error-message">Invalid format for new scheduler</div>';
    }

    // Create a more structured UI for the new format
    const html = `
        <div class="new-format-scheduler">
            <div class="scheduler-header">
                <h2>Schedule Overview</h2>
                <div class="scheduler-stats">
                    <div>Instructors: ${excelSheets.instructors.length}</div>
                    <div>Sections: ${excelSheets.sections.length}</div>
                    <div>Subjects: ${excelSheets.subjects.length}</div>
                    <div>Rooms: ${excelSheets.rooms.length}</div>
                </div>
            </div>
            
            <div class="scheduler-content">
                <div class="schedule-grid">
                    ${generateScheduleGrid()}
                </div>
                
                <div class="schedule-details">
                    <div class="section-list">
                        <h3>Sections</h3>
                        ${generateSectionList()}
                    </div>
                    
                    <div class="instructor-list">
                        <h3>Instructors</h3>
                        ${generateInstructorList()}
                    </div>
                </div>
            </div>
        </div>
    `;

    return html;
}

function generateScheduleGrid() {
    // Generate the schedule grid HTML
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00', '1:00-2:00', '2:00-3:00', '3:00-4:00'];
    
    let gridHtml = '<table class="schedule-table"><thead><tr><th>Time</th>';
    days.forEach(day => gridHtml += `<th>${day}</th>`);
    gridHtml += '</tr></thead><tbody>';
    
    timeSlots.forEach(timeSlot => {
        gridHtml += `<tr><td>${timeSlot}</td>`;
        days.forEach(day => {
            const cellContent = getScheduleCellContent(day, timeSlot);
            gridHtml += `<td>${cellContent}</td>`;
        });
        gridHtml += '</tr>';
    });
    
    gridHtml += '</tbody></table>';
    return gridHtml;
}

function generateSectionList() {
    return excelSheets.sections.map(section => `
        <div class="section-item">
            <div class="section-name">${section.course} ${section.yearLevel}-${section.section}</div>
            <div class="section-students">${section.students} students</div>
        </div>
    `).join('');
}

function generateInstructorList() {
    return excelSheets.instructors.map(instructor => `
        <div class="instructor-item">
            <div class="instructor-name">${instructor.name}</div>
            <div class="instructor-specializations">
                ${instructor.specializations.join(', ')}
            </div>
            <div class="instructor-availability">
                ${instructor.days} ${instructor.time}
            </div>
        </div>
    `).join('');
}

function getScheduleCellContent(day, timeSlot) {
    // Get the schedule content for a specific day and time slot
    // This should be implemented based on your schedule data structure
    return '<div class="schedule-cell">-</div>';
}

// Update the panel renderers to use the new format UI
window.renderRoomsPanel = function(data) {
    if (excelSheets && excelSheets.format === 'new') {
        const html = `
            <div class="rooms-panel">
                <h2>Rooms</h2>
                <div class="rooms-list">
                    ${data.map(room => `
                        <div class="room-item">
                            <div class="room-name">${room.room}</div>
                            <div class="room-capacity">Capacity: ${room.capacity}</div>
                            <div class="room-availability">
                                ${room.days} ${room.timeSlot}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.getElementById('main-content').innerHTML = html;
    } else {
        // ... old code ...
    }
};

// Similar updates for other panel renderers...
// ... existing code ...
