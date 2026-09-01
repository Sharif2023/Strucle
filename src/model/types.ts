export type DisplayType = "block" | "flex" | "grid";

export type LayoutNode = {
  id: string;
  name?: string;
  type: "container" | "box" | "text" | "image" | "button";
  
  children?: LayoutNode[];
  
  layout?: {
    display: DisplayType;
    
    width?: number;
    height?: number;
    
    flexDirection?: "row" | "column";
    flexWrap?: "nowrap" | "wrap";
    
    justifyContent?: 
      | "start" 
      | "center" 
      | "end" 
      | "space-between" 
      | "space-around" 
      | "space-evenly";
      
    alignItems?: "start" | "center" | "end" | "stretch";
    
    gridColumns?: number;
    gridRows?: number;
    
    gap?: number;
  };
  
  position?: {
    x: number;
    y: number;
  };
  
  style?: {
    padding?: number;
    margin?: number;
    borderRadius?: number;
    borderWidth?: number;
    backgroundColor?: string;
  };
  
  gridPlacement?: {
    columnStart?: number;
    columnEnd?: number;
    rowStart?: number;
    rowEnd?: number;
  };
};

export type SelectionState = {
  nodeId: string | null;
};
