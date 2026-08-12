export declare class ProfileService {
    getAllProfiles(): Promise<{
        id: string;
        createdAt: string | null;
        name: string;
        accountId: string | null;
        userAgent: string;
        timezone: string | null;
        language: string | null;
        screenResolution: string | null;
    }[]>;
    getProfileById(id: string): Promise<{
        id: string;
        createdAt: string | null;
        name: string;
        accountId: string | null;
        userAgent: string;
        timezone: string | null;
        language: string | null;
        screenResolution: string | null;
    }>;
    createProfile(data: any): Promise<{
        id: string;
        createdAt: string | null;
        name: string;
        accountId: string | null;
        userAgent: string;
        timezone: string | null;
        language: string | null;
        screenResolution: string | null;
    }>;
    deleteProfile(id: string): Promise<{
        success: boolean;
    }>;
}
