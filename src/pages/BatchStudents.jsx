import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStudentsByBatch } from '../services/studentService';

const BatchStudents = () => {
  const { batchId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const batchStudents = await getStudentsByBatch(batchId);
        setStudents(batchStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [batchId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Batch Students</h2>
      <div className="grid gap-4">
        {students.map((student) => (
          <div 
            key={student.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="font-semibold">{student.name}</h3>
            <p className="text-gray-600">{student.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchStudents;