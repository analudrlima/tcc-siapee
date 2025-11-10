import { useState, useEffect } from 'react'
import { api } from '../services/api'

type ClassSummary = { id: string; name: string; code: string; year: number }

export function useClasses() {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [loading, setLoading] = useState(false)

  const loadClasses = async () => {
    setLoading(true)
    try {
      const r = await api.get('/classes')
      setClasses(r.data)
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadClasses() }, [])
  
  return { classes, loading, reload: loadClasses }
}

export function useStudents(classId?: string) {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  const loadStudents = async (id?: string) => {
    if (!id) {
      setStudents([])
      return
    }
    setLoading(true)
    try {
      const r = await api.get(`/classes/${id}/students`)
      setStudents(r.data)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStudents(classId) }, [classId])
  
  return { students, loading, reload: () => loadStudents(classId) }
}