// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import Login from "./Login"; // your Login.jsx (unchanged)
import MainLayout from "./MainLayout";
import { AlertCircle, BookOpen, Briefcase, LogOut, User } from "lucide-react";

const API_URL = "http://localhost:3000/api";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [courses, setCourses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "learner",
  });

  // prevent double fetching per session
  const loaded = useRef({ courses: false, jobs: false, dashboard: false });

  // Generic API caller
  const apiCall = async (endpoint, options = {}) => {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data;
    } catch (err) {
      setError(err.message || "Network error");
      throw err;
    }
  };

  // Fetchers
  const fetchCourses = async () => {
    try {
      const data = await apiCall("/courses");
      setCourses(data);
    } catch {
      console.error("Failed to fetch courses");
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await apiCall("/jobs");
      setJobs(data);
    } catch {
      console.error("Failed to fetch jobs");
    }
  };

  const fetchDashboard = async () => {
    try {
      const statsData = await apiCall("/dashboard/stats");
      setStats(statsData);

      if (user && user.role === "learner") {
        const enrollData = await apiCall("/enrollments");
        setEnrollments(enrollData);
        const appData = await apiCall("/applications");
        setApplications(appData);
      }
    } catch {
      console.error("Failed to fetch dashboard");
    }
  };

  // Controlled fetching when page/user changes (runs only when user exists)
  useEffect(() => {
    if (!user) return;

    if (currentPage === "courses" && !loaded.current.courses) {
      fetchCourses();
      loaded.current.courses = true;
    }

    if (currentPage === "jobs" && !loaded.current.jobs) {
      fetchJobs();
      loaded.current.jobs = true;
    }

    if (currentPage === "dashboard" && !loaded.current.dashboard) {
      fetchDashboard();
      loaded.current.dashboard = true;
    }
  }, [currentPage, user]); // safe deps

  // Authentication handlers
  // App.jsx — replace existing handleLogin with this
const handleLogin = async (credentials) => {
  // credentials = { email, password } coming from Login.jsx
  setError("");
  setSuccess("");
  try {
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setToken(data.token);
    setUser(data.user);
    setSuccess("Login successful!");
    setCurrentPage("dashboard");

    // reset parent loginForm if you want to keep it in sync (optional)
    setLoginForm({ email: "", password: "" });
  } catch {
    // apiCall already sets error via setError
  }
};


  // App.jsx — replace existing handleRegister with this
const handleRegister = async (regData) => {
  // regData = { name, email, password, role } coming from Login.jsx
  setError("");
  setSuccess("");
  try {
    const data = await apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(regData),
    });
    setToken(data.token);
    setUser(data.user);
    setSuccess("Registration successful!");
    setCurrentPage("dashboard");

    // reset parent registerForm if you want to keep it in sync (optional)
    setRegisterForm({ email: "", password: "", name: "", role: "learner" });
  } catch {
    // apiCall already sets error via setError
  }
};


  const logout = () => {
    setToken(null);
    setUser(null);
    setCurrentPage("home");

    // reset loaded flags so next login can re-fetch
    loaded.current = { courses: false, jobs: false, dashboard: false };

    setSuccess("Logged out successfully");
  };

  const enrollInCourse = async (courseId) => {
    try {
      await apiCall(`/courses/${courseId}/enroll`, { method: "POST" });
      setSuccess("Successfully enrolled in course!");
      // refresh dashboard info
      fetchDashboard();
    } catch {
      // error set in apiCall
    }
  };

  const applyForJob = async (jobId) => {
    try {
      await apiCall(`/jobs/${jobId}/apply`, { method: "POST" });
      setSuccess("Application submitted successfully!");
      fetchDashboard();
    } catch {
      // error set in apiCall
    }
  };

  // ---- Page components (identical UI) ----
  const HomePage = (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="inline-block px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 text-sm font-medium mb-6">
          🚀 Professional Learning Platform
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-indigo-600">SkillSetu</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect learners with mentors and opportunities. Build skills, share knowledge, and grow together.
        </p>
        {!user && (
          <button
            onClick={() => setCurrentPage("auth")}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Get Started Today
          </button>
        )}
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Our Initiative</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Our Mission</h3>
            <p className="text-gray-600">
              Empower individuals to achieve their career goals through personalized, self-paced learning.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <User className="text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Our Vision</h3>
            <p className="text-gray-600">
              Create a world where learning opportunities are accessible to all.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Briefcase className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Our Values</h3>
            <p className="text-gray-600">
              We believe in accessible learning and opportunities for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const AuthPage = (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Login */}
          <div className="p-8 border-r border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Login</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Login
              </button>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium mb-1">Test Accounts:</p>
              <p>Learner: learner@test.com</p>
              <p>Mentor: mentor@test.com</p>
              <p>Client: client@test.com</p>
              <p className="text-gray-600 mt-1">Password: password123</p>
            </div>
          </div>

          {/* Register */}
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-6">Register</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="learner">Learner</option>
                  <option value="mentor">Mentor</option>
                  <option value="client">Client</option>
                </select>
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardPage = (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-gray-600">Role: {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}</p>
      </div>

      {stats && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {user?.role === "learner" && (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-gray-600 mb-2">Enrolled Courses</h3>
                <p className="text-3xl font-bold text-indigo-600">{stats.enrolledCourses}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-gray-600 mb-2">Job Applications</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.applications}</p>
              </div>
            </>
          )}
          {user?.role === "mentor" && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-gray-600 mb-2">Courses Created</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.coursesCreated}</p>
            </div>
          )}
          {user?.role === "client" && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-gray-600 mb-2">Jobs Posted</h3>
              <p className="text-3xl font-bold text-green-600">{stats.jobsPosted}</p>
            </div>
          )}
        </div>
      )}

      {user?.role === "learner" && enrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">My Enrollments</h2>
          <div className="space-y-3">
            {enrollments.map((e) => (
              <div key={e.id} className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold">{e.title}</h3>
                <p className="text-sm text-gray-600">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const CoursesPage = (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Explore Courses</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
            <div className="p-6">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 text-sm rounded-full mb-2">
                {course.difficulty}
              </span>
              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{course.description}</p>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{course.category}</span>
              {user?.role === "learner" && (
                <button
                  onClick={() => enrollInCourse(course.id)}
                  className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Enroll Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const JobsPage = (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Job Opportunities</h1>
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                <p className="text-gray-600">{job.description}</p>
              </div>
              {job.budget && <span className="text-xl font-bold text-green-600">${job.budget}</span>}
            </div>

            {job.skills_required && (
              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills_required.split(",").map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  job.status === "open" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                }`}
              >
                {job.status}
              </span>

              {user?.role === "learner" && job.status === "open" && (
                <button
                  onClick={() => applyForJob(job.id)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // if user is null and currentPage is auth -> show Login component (separate file)
  if (!user && currentPage === "auth") {
    return (
      <Login
        loginForm={loginForm}
        registerForm={registerForm}
        setLoginForm={setLoginForm}
        setRegisterForm={setRegisterForm}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
      />
    );
  }

  // Pass page elements to MainLayout
  return (
    <MainLayout
      user={user}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      logout={logout}
      error={error}
      setError={setError}
      success={success}
      setSuccess={setSuccess}
      // page elements
      homeEl={HomePage}
      authEl={AuthPage}
      dashboardEl={DashboardPage}
      coursesEl={CoursesPage}
      jobsEl={JobsPage}
      // also pass data + actions if needed (MainLayout doesn't need them anymore)
      stats={stats}
      courses={courses}
      jobs={jobs}
      enrollments={enrollments}
      applications={applications}
      enrollInCourse={enrollInCourse}
      applyForJob={applyForJob}
    />
  );
}

export default App;
