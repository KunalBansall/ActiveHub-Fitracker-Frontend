import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Input,
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

  const handleExtend = () => {
    onExtend(extensionMonths);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      handler={onClose}
      size="sm"
      className="bg-white shadow-xl rounded-lg"
      {...({} as any)}
    >
      <DialogHeader
        className="text-2xl font-bold text-gray-900"
        {...({} as any)} // Type casting to any to avoid TypeScript error
      >
        Extend Membership
      </DialogHeader>
      <DialogBody divider className="grid gap-4" {...({} as any)}>
        <Typography
          className="text-gray-700 font-normal"
          {...({} as any)} // Type casting to any to avoid TypeScript error
        >
          Current membership duration: {currentDuration} months
        </Typography>
        <div className="flex items-center gap-4">
          <Typography
            className="text-gray-700 font-normal"
            {...({} as any)} // Type casting to any to avoid TypeScript error
          >
            Extend by:
          </Typography>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            {/* Number Input */}
            <div className="flex flex-col">
              <label
                htmlFor="months-input"
                className="text-sm font-medium text-gray-600"
              >
                Months
              </label>
              <input
                id="months-input"
                type="number"
                value={extensionMonths}
                onChange={(e) => {
                  const value = Math.max(
                    1,
                    Math.min(12, parseInt(e.target.value) || 1)
                  ); // Adjust max value as needed
                  setExtensionMonths(value);
                }}
                min={1}
                max={12} // Adjust as needed
                className="w-24 px-2 py-1 mt-1 text-sm border rounded-md shadow-sm border-gray-200 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-700"
              />
            </div>

            {/* Range Slider */}
            <div className="flex flex-col flex-grow">
              <label
                htmlFor="months-slider"
                className="text-sm font-medium text-gray-600"
              >
                Adjust Months
              </label>
              <input
                id="months-slider"
                type="range"
                value={extensionMonths}
                onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                min={1}
                max={12} // Match the range with your input validation
                className="mt-1 w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm mt-1 text-gray-600">
                {extensionMonths} Months
              </span>
            </div>
          </div>
        </div>
        <Typography
          className="text-gray-700 font-normal"
          {...({} as any)} // Type casting to any to avoid TypeScript error
        >
          New total duration: {currentDuration + extensionMonths} months
        </Typography>
      </DialogBody>
      <DialogFooter className="space-x-2" {...({} as any)}>
        <Button
          variant="outlined"
          color="red"
          onClick={onClose}
          className="px-4 py-2 text-red-500 border border-red-500 rounded hover:bg-red-50"
          {...({} as any)} // Type casting to any to avoid TypeScript error
        >
          Cancel
        </Button>
        <Button
          variant="filled"
          color="green"
          onClick={handleExtend}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          {...({} as any)} // Type casting to any to avoid TypeScript error
        >
          Extend Membership
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
