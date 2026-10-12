CREATE TABLE IF NOT EXISTS quizzes (
  quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text VARCHAR(500) NOT NULL,
  option_a VARCHAR(200) NOT NULL,
  option_b VARCHAR(200) NOT NULL,
  option_c VARCHAR(200) NOT NULL,
  option_d VARCHAR(200) NOT NULL,
  correct_option CHAR(1) NOT NULL,
  marks INT NOT NULL DEFAULT 1,
  CONSTRAINT chk_correct_option CHECK (correct_option IN ('A','B','C','D')),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS attempts (
  attempt_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL,
  total_marks INT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  grade VARCHAR(2) NOT NULL,
  taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_student FOREIGN KEY (student_id)
    REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);
