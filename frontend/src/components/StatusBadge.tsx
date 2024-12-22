import React from "react";

interface Props {
    Text : string,
    Type?:string,
    isRemovable?:boolean,
    removeFilter?:(e:any)=>void
}
const StatusBadge : React.FC<Props> = ({Text,Type,isRemovable,removeFilter})=>{

    return(
        <span className={` px-2.5 py-0.5 rounded-full text-xs font-medium  ${
                        Text === "active" || Type == "green"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {Text}
                      {isRemovable && 
                <svg data-value={Text} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={`${Text=="expired" ? "red" : "orange"}`} className="size-4 inline-block cursor-pointer" onClick={removeFilter}>
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
            </svg>
            }
                      
        </span>
    )
} 

interface HollowStatusBadgePROPS{Text:string,isRemovable:boolean,Handler?:(e:any)=>void};

const HollowStatusBadge : React.FC<HollowStatusBadgePROPS>=({Text,isRemovable,Handler})=>{
    return (
        <span data-value={Text} onClick={Handler} className={`cursor-pointer flex justify-between items-center p-1 gap-1 bg-white border rounded-full text-xs ${Text=="expired" ? "border-red-800" : "border-orange-400"}`}>
            {Text}
        </span>
    )
}
export {HollowStatusBadge};
export default React.memo(StatusBadge);