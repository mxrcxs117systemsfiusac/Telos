import { useState, useEffect } from 'react';

export interface ScheduleEvent {
    id: number;
    title: string;
    description?: string;
    day: string; // 'Monday', 'Tuesday', etc.
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
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
    const [schedule, setSchedule] = useState<ScheduleData>({ config: DEFAULT_CONFIG, events: [] });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3001/api/schedule')
            .then(res => res.json())
            .then(data => {
                // Adapt adapter if necessary, assuming API returns { events: [] } or similar
                // If API returns different shape, normalize here.
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
    }, []);

    const saveEvent = async (event: ScheduleEvent) => {
        const updatedEvents = schedule.events.some(e => e.id === event.id)
            ? schedule.events.map(e => e.id === event.id ? event : e)
            : [...schedule.events, event];

        const newSchedule = { ...schedule, events: updatedEvents };
        setSchedule(newSchedule);

        await fetch('http://localhost:3001/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSchedule)
        });
    };

    const deleteEvent = async (id: number) => {
        const updatedEvents = schedule.events.filter(e => e.id !== id);
        const newSchedule = { ...schedule, events: updatedEvents };
        setSchedule(newSchedule);

        await fetch('http://localhost:3001/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSchedule)
        });
    };

    return { schedule, isLoaded, saveEvent, deleteEvent };
};
