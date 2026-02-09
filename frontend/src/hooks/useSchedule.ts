import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

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

export const useSchedule = () => {
    const { token } = useAuth();
    const [schedule, setSchedule] = useState<ScheduleData>({ config: DEFAULT_CONFIG, events: [] });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!token) return;

        api.get('/schedule')
            .then(data => {
                const events = Array.isArray(data.events) ? data.events : [];
                setSchedule({
                    config: data.config || DEFAULT_CONFIG,
                    events: events
                });
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Error loading schedule:", err);
                setIsLoaded(true);
            });
    }, [token]);

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
                await api.put(`/schedule/${event.id}`, event);
            } else {
                const saved = await api.post('/schedule', event);
                // Update temp ID with real ID
                setSchedule(prev => ({
                    ...prev,
                    events: prev.events.map(e => e.id === tempId ? { ...saved, start: saved.start_time || saved.start, end: saved.end_time || saved.end } : e)
                }));
            }
        } catch (err) {
            console.error('Save failed', err);
            // Revert or show error (optimization: implement revert logic)
        }
    };

    const deleteEvent = async (id: number) => {
        setSchedule(prev => ({
            ...prev,
            events: prev.events.filter(e => e.id !== id)
        }));

        try {
            await api.delete(`/schedule/${id}`);
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    return { schedule, isLoaded, saveEvent, deleteEvent };
};
