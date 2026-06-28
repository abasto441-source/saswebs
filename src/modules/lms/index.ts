import { type Course, type Enrollment } from '@/core/config/supabase';

export function getStudentEnrollments(enrollments: Enrollment[], courseId: string): Enrollment[] {
  return enrollments.filter(e => e.courseId === courseId);
}

export function calculateCourseProgress(enrollment: Enrollment): number {
  if (!enrollment.lessonsCompleted || enrollment.lessonsCompleted.length === 0) return 0;
  return Math.min(Math.round((enrollment.lessonsCompleted.length / 10) * 100), 100);
}
