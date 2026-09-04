import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  X,
  Sparkles,
  BookOpen
} from 'lucide-react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getStudents
} from '../../services/dataService';
import { Department, Student } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface DepartmentManagementProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ onShowToast }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // Delete State
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allDepts, allStudents] = await Promise.all([
        getDepartments(),
        getStudents()
      ]);
      setDepartments(allDepts);
      setStudents(allStudents);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Error loading departments', 'Could not retrieve departments from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('error', 'Validation Error', 'Department name is required.');
      return;
    }

    try {
      if (editingDept) {
        await updateDepartment(editingDept.departmentId, {
          name: name.trim(),
          code: code.trim().toUpperCase()
        });
        onShowToast('success', 'Department Updated', `${name} details updated.`);
      } else {
        await createDepartment(name.trim(), code.trim().toUpperCase());
        onShowToast('success', 'Department Created', `${name} department added to university records.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      onShowToast('error', 'Operation Failed', err.message || 'Could not save department.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    const studentCount = students.filter(s => s.departmentId === deletingDept.departmentId).length;
    if (studentCount > 0) {
      onShowToast('error', 'Cannot Delete Department', `There are ${studentCount} students assigned to this department. Please reassign them first.`);
      setDeletingDept(null);
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteDepartment(deletingDept.departmentId);
      onShowToast('success', 'Department Removed', `${deletingDept.name} has been deleted.`);
      setDeletingDept(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      onShowToast('error', 'Deletion Failed', err.message || 'Could not delete department.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Academic Department Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure academic departments, short codes, and view real-time student allocations.
          </p>
        </div>

        <button
          id="btn-add-department"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const deptStudents = students.filter(s => s.departmentId === dept.departmentId);
          const studentCount = deptStudents.length;

          return (
            <div
              key={dept.departmentId}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {dept.code || 'DEPT'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {dept.name}
                </h3>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{studentCount} {studentCount === 1 ? 'Student' : 'Students'}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Department"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingDept(dept)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {departments.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No departments found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Add a department above or load standard university engineering departments.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            Create First Department
          </button>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence and Data Science"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Code (Optional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AI-DS"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden font-mono uppercase text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Short 2-5 letter code used for badges and reports.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDept}
        title="Delete Department"
        message={`Are you sure you want to remove "${deletingDept?.name}"?`}
        confirmLabel="Delete Department"
        isDestructive
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingDept(null)}
      />
    </div>
  );
};
