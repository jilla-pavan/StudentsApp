import React from 'react';
import Modal from '../common/Modal';
import StudentForm from '../forms/StudentForm';
import BatchForm from '../forms/BatchForm';
import MockTestForm from '../forms/MockTestForm';
import AttendanceDetailsModal from '../AttendanceDetailsModal';
import AssignScoresModal from '../AssignScoresModal';

const AppModals = ({
  showStudentForm,
  showBatchForm,
  showMockForm,
  showAttendanceDetails,
  showAssignScores,
  editingStudent,
  editingBatch,
  editingMock,
  selectedStudent,
  selectedTest,
  students,
  batches,
  filters,
  onCloseStudentForm,
  onCloseBatchForm,
  onCloseMockForm,
  onCloseAttendanceDetails,
  onCloseAssignScores,
  handleStudentSubmit,
  handleBatchSubmit,
  handleMockSubmit,
  handleMarkAttendance,
  handleAssignScores
}) => {
  return (
    <>
      {/* Student Form Modal */}
      <Modal
        isOpen={showStudentForm}
        onClose={onCloseStudentForm}
        title={editingStudent ? "Edit Student" : "Add Student"}
      >
        <StudentForm
          student={editingStudent}
          batches={batches}
          onSubmit={handleStudentSubmit}
          onCancel={onCloseStudentForm}
        />
      </Modal>

      {/* Batch Form Modal */}
      <Modal
        isOpen={showBatchForm}
        onClose={onCloseBatchForm}
        title={editingBatch ? "Edit Batch" : "Add Batch"}
      >
        <BatchForm
          batch={editingBatch}
          onSubmit={handleBatchSubmit}
          onCancel={onCloseBatchForm}
        />
      </Modal>

      {/* Mock Test Form Modal */}
      <Modal
        isOpen={showMockForm}
        onClose={onCloseMockForm}
        title={editingMock ? "Edit Mock Test" : "Add Mock Test"}
      >
        <MockTestForm
          test={editingMock}
          batches={batches}
          onSubmit={handleMockSubmit}
          onCancel={onCloseMockForm}
        />
      </Modal>

      {/* Attendance Details Modal */}
      {selectedStudent && (
        <Modal
          isOpen={showAttendanceDetails}
          onClose={onCloseAttendanceDetails}
          title="Attendance Details"
        >
          <AttendanceDetailsModal
            student={selectedStudent}
            onClose={onCloseAttendanceDetails}
            onMarkAttendance={handleMarkAttendance}
          />
        </Modal>
      )}

      {/* Assign Scores Modal */}
      {showAssignScores && selectedTest && (
        <Modal 
          isOpen={showAssignScores}
          onClose={onCloseAssignScores}
          title="Assign Mock Test Scores"
        >
          <AssignScoresModal
            test={selectedTest}
            students={students}
            onClose={onCloseAssignScores}
            onSave={handleAssignScores}
          />
        </Modal>
      )}
    </>
  );
};

export default AppModals; 