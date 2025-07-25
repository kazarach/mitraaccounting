import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import KasBankArsipTable from "./tabledata";
const KasBankArsip = () => {
    return (
        <div className="flex justify-center items-center w-full pt-4">
            <Card className="w-full mx-4">
                <CardHeader>
                    <CardTitle>Arsip Kas dan Bank</CardTitle>
                </CardHeader>
                <CardContent>
                    <KasBankArsipTable/>
                </CardContent>
            </Card>
        </div>
    );
};

export default KasBankArsip; 