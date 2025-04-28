import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
} from "@material-tailwind/react";

interface ExtendMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtend: (months: number) => void;
  currentDuration: number;
}

export default function ExtendMembershipModal({
  isOpen,
  onClose,
  onExtend,
  currentDuration,
}: ExtendMembershipModalProps) {
  const [extensionMonths, setExtensionMonths] = useState(1);
  const newDuration = currentDuration + extensionMonths;
  
  // Predefined duration options for quick selection
  const durationOptions = [1, 3, 6, 12];

  const handleExtend = () => {
    onExtend(extensionMonths);
    onClose();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure input is between 1 and 12
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setExtensionMonths(Math.max(1, Math.min(12, value)));
    }
  };

  return (
    <Dialog
      open={isOpen}
      handler={onClose}
      size="sm"
      className="bg-white shadow-xl rounded-lg max-w-md mx-auto"
      {...({} as any)}
    >
      <DialogHeader className="px-6 pt-6 pb-0" {...({} as any)}>
        <h3 className="text-xl font-semibold text-gray-900">
          Extend Membership
        </h3>
      </DialogHeader>
      
      <DialogBody className="px-6 py-4" {...({} as any)}>
        <div className="space-y-6">
          {/* Current status card */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800 font-medium">Current Duration</p>
              <span className="bg-white px-3 py-1 rounded-full text-blue-700 font-medium text-sm">
                {currentDuration} months
              </span>
            </div>
          </div>
          
          {/* Quick selection buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Extend by
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setExtensionMonths(months)}
                  className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    extensionMonths === months
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {months} {months === 1 ? "month" : "months"}
                </button>
              ))}
            </div>
          </div>
          
          {/* Input and slider combination */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Custom duration
              </label>
              
              {/* Number input and slider in a combined control */}
              <div className="flex items-center space-x-4">
                <div className="relative rounded-md shadow-sm w-24">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={extensionMonths}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 pl-3 pr-7 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <span className="text-gray-500 text-xs">mo</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <input
                    type="range"
                    value={extensionMonths}
                    onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                    min="1"
                    max="12"
                    step="1"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-800 font-medium">New Total Duration</p>
              <span className="bg-white px-3 py-1 rounded-full text-green-700 font-medium text-sm">
                {newDuration} months
              </span>
            </div>
          </div>
        </div>
      </DialogBody>
      
      <DialogFooter className="px-6 py-4 border-t border-gray-200" {...({} as any)}>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outlined"
            onClick={onClose}
            className="flex-1 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50"
            {...({} as any)}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            onClick={handleExtend}
            className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700"
            {...({} as any)}
          >
            Extend Membership
          </Button>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
