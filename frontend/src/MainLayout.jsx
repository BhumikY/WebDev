// src/MainLayout.jsx
import React from "react";
import { LogOut, AlertCircle } from "lucide-react";

export default function MainLayout({
  user,
  currentPage,
  setCurrentPage,
  logout,
  error,
  setError,
  success,
  setSuccess,
  // page elements passed from App.jsx:
  homeEl,
  authEl,
  dashboardEl,
  coursesEl,
  jobsEl,
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1
            className="text-2xl font-bold text-indigo-600 cursor-pointer"
            onClick={() => setCurrentPage(user ? "dashboard" : "home")}
          >
            SkillSetu
          </h1>

          {user && (
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg"
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage("courses")}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg"
              >
                Courses
              </button>
              <button
                onClick={() => setCurrentPage("jobs")}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg"
              >
                Jobs
              </button>
            </div>
          )}

          <div>
            {user && (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Alerts */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            {error}
            <button onClick={() => setError("")} className="ml-auto">
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            {success}
            <button onClick={() => setSuccess("")} className="ml-4">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Page switch: render the *elements* passed from App.jsx */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {currentPage === "home" && homeEl}
        {currentPage === "auth" && authEl}
        {currentPage === "dashboard" && dashboardEl}
        {currentPage === "courses" && coursesEl}
        {currentPage === "jobs" && jobsEl}
      </div>
    </div>
  );
}
