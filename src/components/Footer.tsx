
import { Card } from "@/components/ui/card";

export const Footer = () => {
  return (
    <footer className="w-full mt-16 py-8 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <Card className="border-0 bg-white/50 backdrop-blur-sm shadow-lg">
          <div className="p-6 text-center">
            <p className="text-gray-700 font-medium">
              © 2025 Excel Analytics. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Excel Analytics Platform - Transform your data into insights
            </p>
          </div>
        </Card>
      </div>
    </footer>
  );
};
