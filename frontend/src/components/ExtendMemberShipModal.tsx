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
      <DialogBody divider className="grid gap-4"   {...({} as any)}>
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
          <Input
        type="number"
        label="Months"
        value={extensionMonths.toString()}
        onChange={(e) =>
          setExtensionMonths(Math.max(1, parseInt(e.target.value) || 0))
        }
        min={1}
        className="w-24"
        {...({} as any)} // Type casting to any to avoid TypeScript error
      />
        </div>
        <Typography
        className="text-gray-700 font-normal"
        {...({} as any)} // Type casting to any to avoid TypeScript error
      >
        New total duration: {currentDuration + extensionMonths} months
      </Typography>
      </DialogBody>
      <DialogFooter className="space-x-2"   {...({} as any)}>
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
