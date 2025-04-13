import React from 'react';
import { Route, Routes } from 'react-router-dom';
import StudentsView from '../components/StudentsView';
import BatchesView from '../components/BatchsView';
import MockTestsView from '../components/views/MockTestsView';
import AttendanceView from '../components/views/AttendanceView';
import BatchStudentsView from '../components/views/BatchStudentsView';
import StudentDetails from '../pages/StudentDetails';
import Reports from '../pages/Reports';

const AppRoutes = ({ 
  renderFilters, 
  renderStudentList, 
  renderBatchList,
  renderMockTestList,
  students,
  batches,
  filters,
  onFilterChange,
  onAddStudent,
  onAddBatch,
  onMarkAttendance,
  onEditStudent,
  onDeleteStudent,
  handleAssignScores,
  updateStudent
}) => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <StudentsView 
            renderFilters={renderFilters} 
            renderStudentList={renderStudentList}
            onAddStudent={onAddStudent}
            onFilterChange={onFilterChange}
          />
        }
      />
      <Route
        path="/students"
        element={
          <StudentsView 
            renderFilters={renderFilters} 
            renderStudentList={renderStudentList}
            onAddStudent={onAddStudent}
            onFilterChange={onFilterChange}
          />
        }
      />
      <Route
        path="/batches"
        element={
          <BatchesView 
            renderBatchList={renderBatchList}
            onAddBatch={onAddBatch}
            totalBatches={batches.length}
          />
        }
      />
      <Route
        path="/mock-tests"
        element={
          <MockTestsView 
            renderMockTestList={renderMockTestList}
            students={students}
            filters={filters}
            batches={batches}
            onFilterChange={onFilterChange}
            onAssignScores={handleAssignScores}
            updateStudent={updateStudent}
          />
        }
      />
      <Route
        path="/attendance"
        element={
          <AttendanceView 
            students={students}
            batches={batches}
            onMarkAttendance={onMarkAttendance}
          />
        }
      />
      <Route
        path="/batch/:batchId/students"
        element={
          <BatchStudentsView 
            students={students}
            batches={batches}
            onEditStudent={onEditStudent}
            onDeleteStudent={onDeleteStudent}
          />
        }
      />
      <Route path="/student/:studentId" element={<StudentDetails />} />
    </Routes>
  );
};

export default AppRoutes; 