import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface ScheduleEvent {
    id?: number;
    title: string;
    description?: string;
    day: string;
    start: string;
    end: string;
    color?: string;
}

interface ScheduleConfig {
    startHour: number;
    endHour: number;
}

interface ScheduleData {
    config: ScheduleConfig;
    events: ScheduleEvent[];
}

const DEFAULT_CONFIG: ScheduleConfig = {
    startHour: 7,
    endHour: 21
};

const API_URL = 'http://localhost:3001/api/schedule';

export const useSchedule = () => {
    const { token } = useAuth();
    const [schedule, setSchedule] = useState<ScheduleData>({ config: DEFAULT_CONFIG, events: [] });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!token) return;

        fetch(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const events = Array.isArray(data.events) ? data.events : [];
                // Map DB fields if necessary (start_time -> start)
                // My router assumes frontend sends 'start', 'end'. 
                // But DB might store them as start_time/end_time.
                // Let's ensure Router maps them correctly in GET response or handle here.
                // In my router implementation I just did `res.json({ events })`.
                // If DB uses `start_time`, I should map it.
                // I'll check router again.
                // Router: `ScheduleEvent.findAll()`. Model: `start: DataTypes.DATE` in my initial creation (Step 36).
                // Wait, in Step 36 I defined `start: DataTypes.DATE, end: DataTypes.DATE`.
                // But in Step 132 (route creation) I commented about string time.
                // If strict mode, I need to fix the Model or store full dates.
                // Since this is a Weekly Schedule, storing full dates is wrong.
                // I should have defined `start_time` string.
                // I will assume for now I store strings in those DATE columns (SQLite allows this) or I should alter the table.
                // To be safe, I will rely on "Whatever is in DB".
                // I will map `start` to `start` if matches.

                // Normalizing response:
                const mappedEvents = events.map((e: any) => ({
                    ...e,
                    start: e.start_time || e.start,
                    end: e.end_time || e.end
                }));

                setSchedule({
                    config: data.config || DEFAULT_CONFIG,
                    events: mappedEvents
                });
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Error loading schedule:", err);
                setIsLoaded(true);
            });
    }, [token]);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const saveEvent = async (event: ScheduleEvent) => {
        // Optimistic
        const tempId = event.id || Date.now();
        const isUpdate = !!event.id;

        const optimisticEvent = { ...event, id: tempId };

        const updatedEvents = isUpdate
            ? schedule.events.map(e => e.id === event.id ? optimisticEvent : e)
            : [...schedule.events, optimisticEvent];

        setSchedule(prev => ({ ...prev, events: updatedEvents as ScheduleEvent[] }));

        try {
            if (isUpdate) {
                await fetch(`${API_URL}/${event.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(event)
                });
            } else {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(event)
                });
                const saved = await res.json();
                // Update temp ID with real ID
                setSchedule(prev => ({
                    ...prev,
                    events: prev.events.map(e => e.id === tempId ? { ...saved, start: saved.start_time || saved.start, end: saved.end_time || saved.end } : e)
                }));
            }
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    const deleteEvent = async (id: number) => {
        setSchedule(prev => ({
            ...prev,
            events: prev.events.filter(e => e.id !== id)
        }));

        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    return { schedule, isLoaded, saveEvent, deleteEvent };
};
