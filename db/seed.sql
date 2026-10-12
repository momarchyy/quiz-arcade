INSERT INTO quizzes (title, subject, description)
VALUES ('Web Basics', 'Web Development', 'HTML, CSS and JavaScript fundamentals');
SET @q1 = LAST_INSERT_ID();

INSERT INTO quizzes (title, subject, description)
VALUES ('Database Basics', 'DBMS', 'SQL and relational database concepts');
SET @q2 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) VALUES
(@q1, 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Hyperlinks and Text Markup Language', 'Home Tool Markup Language', 'A', 1),
(@q1, 'Which CSS property changes the text color?', 'font-color', 'color', 'text-style', 'fgcolor', 'B', 1),
(@q1, 'Which keyword declares a constant in JavaScript?', 'var', 'let', 'const', 'static', 'C', 1),
(@q1, 'Which HTML tag creates the largest heading?', '<h6>', '<head>', '<heading>', '<h1>', 'D', 1),
(@q1, 'What does CSS stand for?', 'Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets', 'B', 1),
(@q2, 'Which SQL statement retrieves data from a table?', 'GET', 'SELECT', 'FETCH', 'OPEN', 'B', 1),
(@q2, 'A primary key must be:', 'Unique and not null', 'Allowed to repeat', 'Always text', 'Optional', 'A', 1),
(@q2, 'Which SQL command adds a new row to a table?', 'ADD ROW', 'INSERT INTO', 'UPDATE', 'CREATE', 'B', 1),
(@q2, 'What does a foreign key do?', 'Encrypts data', 'Links two tables', 'Deletes rows', 'Sorts rows', 'B', 1),
(@q2, 'Which clause filters rows in a SELECT query?', 'ORDER BY', 'GROUP BY', 'WHERE', 'LIMIT', 'C', 1);

INSERT INTO students (name, email) VALUES
('Asha', 'asha@example.com'),
('Ravi', 'ravi@example.com'),
('Meena', 'meena@example.com');

INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q1, 5, 5, 100.00, 'S' FROM students s WHERE s.email = 'asha@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q1, 4, 5, 80.00, 'A' FROM students s WHERE s.email = 'ravi@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q1, 3, 5, 60.00, 'C' FROM students s WHERE s.email = 'meena@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q2, 4, 5, 80.00, 'A' FROM students s WHERE s.email = 'asha@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q2, 2, 5, 40.00, 'F' FROM students s WHERE s.email = 'ravi@example.com';
