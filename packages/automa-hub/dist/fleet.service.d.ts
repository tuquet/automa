export declare class FleetService {
    getAllFleets(): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        name: string;
        description: string | null;
    }[]>;
    getFleetById(id: string): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        name: string;
        description: string | null;
    }>;
    createFleet(data: any): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        name: string;
        description: string | null;
    }>;
    addFleetMember(fleetId: string, accountId: string): Promise<{
        success: boolean;
    }>;
    getFleetMembers(fleetId: string): Promise<{
        createdAt: string | null;
        accountId: string;
        fleetId: string;
    }[]>;
    removeFleetMember(fleetId: string, accountId: string): Promise<{
        success: boolean;
    }>;
}
