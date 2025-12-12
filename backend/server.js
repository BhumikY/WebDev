// SkillSetu Backend API with Express.js and SQLite
// Run with: node server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Setup
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize Database Schema
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('learner', 'mentor', 'client')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Courses table
    db.run(`CREATE TABLE courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      difficulty TEXT CHECK(difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
      instructor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instructor_id) REFERENCES users(id)
    )`);

    // Enrollments table
    db.run(`CREATE TABLE enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      course_id INTEGER,
      progress INTEGER DEFAULT 0,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES users(id)
    )`);

    // Jobs table
    db.run(`CREATE TABLE jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      client_id INTEGER,
      skills_required TEXT,
      budget REAL,
      status TEXT CHECK(status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id)
    )`);

    // Applications table
    db.run(`CREATE TABLE applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      user_id INTEGER,
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Insert sample data
    insertSampleData();
  });
}

// Insert sample data
function insertSampleData() {
  const password = bcrypt.hashSync('password123', 10);
  
  // Sample users
  db.run(`INSERT INTO users (email, password, name, role) VALUES 
    ('learner@test.com', ?, 'John Learner', 'learner'),
    ('mentor@test.com', ?, 'Jane Mentor', 'mentor'),
    ('client@test.com', ?, 'Bob Client', 'client')`, 
    [password, password, password]
  );

  // Sample courses
  db.run(`INSERT INTO courses (title, description, category, difficulty, instructor_id) VALUES 
    ('Video Editing for YouTube', 'Learn to edit engaging vlogs that captivate audiences', 'Design', 'Beginner', 2),
    ('Basic Web Development', 'Master HTML, CSS, and basic JavaScript', 'Tech', 'Beginner', 2),
    ('Graphic Design (Hindi)', 'Complete graphic design course in Hindi', 'Design', 'Intermediate', 2),
    ('Advanced Python Programming', 'Deep dive into Python frameworks and best practices', 'Tech', 'Advanced', 2)`
  );

  // Sample jobs
  db.run(`INSERT INTO jobs (title, description, client_id, skills_required, budget, status) VALUES 
    ('Website Redesign', 'Need a modern website redesign for e-commerce', 3, 'HTML,CSS,JavaScript', 5000, 'open'),
    ('Video Editor Needed', 'Looking for experienced video editor for YouTube channel', 3, 'Video Editing,Adobe Premiere', 2000, 'open'),
    ('Logo Design Project', 'Create a professional logo for tech startup', 3, 'Graphic Design,Illustrator', 1500, 'open')`
  );
}

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ===== AUTHENTICATION ROUTES =====

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!['learner', 'mentor', 'client'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, name, role],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Registration failed' });
      }

      const token = jwt.sign(
        { id: this.lastID, email, role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: this.lastID, email, name, role }
      });
    }
  );
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Login failed' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', 
    [req.user.id], 
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// ===== COURSES ROUTES =====

// Get all courses
app.get('/api/courses', (req, res) => {
  const { category, difficulty } = req.query;
  let query = 'SELECT * FROM courses';
  const params = [];

  if (category || difficulty) {
    query += ' WHERE';
    if (category) {
      query += ' category = ?';
      params.push(category);
    }
    if (difficulty) {
      query += category ? ' AND' : '';
      query += ' difficulty = ?';
      params.push(difficulty);
    }
  }

  db.all(query, params, (err, courses) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }
    res.json(courses);
  });
});

// Get course by ID
app.get('/api/courses/:id', (req, res) => {
  db.get('SELECT * FROM courses WHERE id = ?', [req.params.id], (err, course) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch course' });
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  });
});

// Create course (mentor only)
app.post('/api/courses', authenticateToken, (req, res) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ error: 'Only mentors can create courses' });
  }

  const { title, description, category, difficulty } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required' });
  }

  db.run(
    'INSERT INTO courses (title, description, category, difficulty, instructor_id) VALUES (?, ?, ?, ?, ?)',
    [title, description, category, difficulty, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create course' });
      }
      res.status(201).json({
        message: 'Course created successfully',
        courseId: this.lastID
      });
    }
  );
});

// Enroll in course
app.post('/api/courses/:id/enroll', authenticateToken, (req, res) => {
  if (req.user.role !== 'learner') {
    return res.status(403).json({ error: 'Only learners can enroll in courses' });
  }

  db.run(
    'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
    [req.user.id, req.params.id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Already enrolled' });
        }
        return res.status(500).json({ error: 'Enrollment failed' });
      }
      res.status(201).json({ message: 'Enrolled successfully' });
    }
  );
});

// Get user's enrollments
app.get('/api/enrollments', authenticateToken, (req, res) => {
  db.all(
    `SELECT e.*, c.title, c.description, c.category, c.difficulty 
     FROM enrollments e 
     JOIN courses c ON e.course_id = c.id 
     WHERE e.user_id = ?`,
    [req.user.id],
    (err, enrollments) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch enrollments' });
      }
      res.json(enrollments);
    }
  );
});

// ===== JOBS ROUTES =====

// Get all jobs
app.get('/api/jobs', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM jobs';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  db.all(query, params, (err, jobs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
    res.json(jobs);
  });
});

// Get job by ID
app.get('/api/jobs/:id', (req, res) => {
  db.get('SELECT * FROM jobs WHERE id = ?', [req.params.id], (err, job) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch job' });
    }
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  });
});

// Create job (client only)
app.post('/api/jobs', authenticateToken, (req, res) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'Only clients can post jobs' });
  }

  const { title, description, skills_required, budget } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required' });
  }

  db.run(
    'INSERT INTO jobs (title, description, client_id, skills_required, budget) VALUES (?, ?, ?, ?, ?)',
    [title, description, req.user.id, skills_required, budget],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create job' });
      }
      res.status(201).json({
        message: 'Job created successfully',
        jobId: this.lastID
      });
    }
  );
});

// Apply for job
app.post('/api/jobs/:id/apply', authenticateToken, (req, res) => {
  if (req.user.role !== 'learner') {
    return res.status(403).json({ error: 'Only learners can apply for jobs' });
  }

  db.run(
    'INSERT INTO applications (job_id, user_id) VALUES (?, ?)',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Already applied' });
        }
        return res.status(500).json({ error: 'Application failed' });
      }
      res.status(201).json({ message: 'Application submitted successfully' });
    }
  );
});

// Get user's applications
app.get('/api/applications', authenticateToken, (req, res) => {
  db.all(
    `SELECT a.*, j.title, j.description, j.budget, j.status as job_status 
     FROM applications a 
     JOIN jobs j ON a.job_id = j.id 
     WHERE a.user_id = ?`,
    [req.user.id],
    (err, applications) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch applications' });
      }
      res.json(applications);
    }
  );
});

// ===== DASHBOARD ROUTES =====

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const stats = {};

  if (req.user.role === 'learner') {
    db.get(
      'SELECT COUNT(*) as count FROM enrollments WHERE user_id = ?',
      [req.user.id],
      (err, result) => {
        stats.enrolledCourses = result ? result.count : 0;
        
        db.get(
          'SELECT COUNT(*) as count FROM applications WHERE user_id = ?',
          [req.user.id],
          (err, result) => {
            stats.applications = result ? result.count : 0;
            res.json(stats);
          }
        );
      }
    );
  } else if (req.user.role === 'mentor') {
    db.get(
      'SELECT COUNT(*) as count FROM courses WHERE instructor_id = ?',
      [req.user.id],
      (err, result) => {
        stats.coursesCreated = result ? result.count : 0;
        res.json(stats);
      }
    );
  } else if (req.user.role === 'client') {
    db.get(
      'SELECT COUNT(*) as count FROM jobs WHERE client_id = ?',
      [req.user.id],
      (err, result) => {
        stats.jobsPosted = result ? result.count : 0;
        res.json(stats);
      }
    );
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SkillSetu API',
    version: '1.0.0',
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me'
      ],
      courses: [
        'GET /api/courses',
        'GET /api/courses/:id',
        'POST /api/courses',
        'POST /api/courses/:id/enroll',
        'GET /api/enrollments'
      ],
      jobs: [
        'GET /api/jobs',
        'GET /api/jobs/:id',
        'POST /api/jobs',
        'POST /api/jobs/:id/apply',
        'GET /api/applications'
      ],
      dashboard: [
        'GET /api/dashboard/stats'
      ]
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SkillSetu API running on http://localhost:${PORT}`);
  console.log('\nTest Accounts:');
  console.log('Learner: learner@test.com / password123');
  console.log('Mentor: mentor@test.com / password123');
  console.log('Client: client@test.com / password123');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\nDatabase connection closed');
    }
    process.exit(0);
  });
});