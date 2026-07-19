"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Package, ArrowDownUp } from "lucide-react";
import { createInventoryItem, adjustStock } from "@/lib/actions/inventory";

interface InventoryTableProps {
  initialItems: any[];
  organizationId: string;
  activeProjects?: any[];
}

export function InventoryTable({ initialItems, organizationId, activeProjects = [] }: InventoryTableProps) {
  const [items, setItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Adding new item state
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "MODULES", trackingType: "EXACT_COUNT", unit: "nos", sku: "", quantityInStock: "" });
  
  // Adjust stock state
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustMode, setAdjustMode] = useState<"ADJUST">("ADJUST");
  const [adjustData, setAdjustData] = useState({ quantity: 0, type: "IN", notes: "", referenceId: "" });

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddItem = async () => {
    if (!newItem.name) return;
    const res = await createInventoryItem({ ...newItem, organizationId });
    if (res.success && res.data) {
      setItems([...items, res.data]);
      setIsAdding(false);
      setNewItem({ name: "", category: "MODULES", trackingType: "EXACT_COUNT", unit: "nos", sku: "", quantityInStock: "" });
    } else {
      alert("Error adding item: " + res.error);
    }
  };

  const handleAdjustStock = async (itemId: string) => {
    if (adjustData.quantity <= 0) return;
    const res = await adjustStock({
      itemId,
      quantity: adjustData.quantity,
      type: adjustData.type,
      notes: adjustData.notes,
      referenceId: adjustData.referenceId || undefined
    });
    if (res.success && res.data) {
      setItems(items.map(item => item.id === itemId ? res.data.item : item));
      setAdjustingId(null);
      setAdjustData({ quantity: 0, type: "IN", notes: "", referenceId: "" });
    } else {
      alert("Error adjusting stock: " + res.error);
    }
  };

  const formatCategory = (cat: string) => cat.replace(/_/g, " ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search inventory..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-[#1C3384] hover:bg-blue-900 text-white gap-2">
          <Plus size={16} /> Add Item
        </Button>
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4 items-end animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
            <Input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Solar Panel 550W" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</label>
            <Input value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Stock</label>
            <Input type="number" value={newItem.quantityInStock} onChange={e => setNewItem({...newItem, quantityInStock: e.target.value})} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              value={newItem.category} 
              onChange={e => setNewItem({...newItem, category: e.target.value})}
            >
              <option value="MODULES">Modules</option>
              <option value="INVERTERS">Inverters</option>
              <option value="STRUCTURES">Structures</option>
              <option value="ELECTRICAL_BOS">Electrical BOS</option>
              <option value="CIVIL_BOS">Civil BOS</option>
              <option value="GENERAL_CONSUMABLES">General Consumables</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tracking</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              value={newItem.trackingType} 
              onChange={e => {
                const type = e.target.value;
                setNewItem({...newItem, trackingType: type, unit: type === "EXACT_COUNT" ? "nos" : "metre"});
              }}
            >
              <option value="EXACT_COUNT">Exact Count</option>
              <option value="VARIABLE_BULK">Variable Bulk</option>
            </select>
          </div>
          {newItem.trackingType === "VARIABLE_BULK" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                value={newItem.unit} 
                onChange={e => setNewItem({...newItem, unit: e.target.value})}
              >
                <option value="metre">metre</option>
                <option value="feet">feet</option>
                <option value="kg">kg</option>
                <option value="ltr">ltr</option>
                <option value="nos">nos</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
             <Button onClick={handleAddItem} className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[300px]">Item Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  <Package className="mx-auto mb-2 opacity-20" size={32} />
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(item => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      {item.sku && <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 uppercase text-[9px] font-bold tracking-wider">
                      {formatCategory(item.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant="secondary" className={
                        item.trackingType === "EXACT_COUNT" 
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-50" 
                        : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                     }>
                        {formatCategory(item.trackingType)}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-lg font-black text-slate-900">{item.quantityInStock}</span>
                    <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {adjustingId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                           <select 
                             className="h-8 rounded border-slate-200 text-xs px-2"
                             value={adjustData.type}
                             onChange={e => setAdjustData({...adjustData, type: e.target.value})}
                           >
                             <option value="IN">IN (+)</option>
                             <option value="OUT">OUT (-)</option>
                           </select>
                        <Input 
                          type="number" 
                          className="h-8 w-20 text-xs" 
                          value={adjustData.quantity || ""}
                          onChange={e => setAdjustData({...adjustData, quantity: parseFloat(e.target.value) || 0})}
                          placeholder="Qty"
                        />
                        <Button size="sm" onClick={() => handleAdjustStock(item.id)} className="h-8 bg-[#1C3384]">OK</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAdjustingId(null)} className="h-8">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-[#1C3384]"
                          onClick={() => {
                            setAdjustMode("ADJUST");
                            setAdjustData({ quantity: 0, type: "IN", notes: "", referenceId: "" });
                            setAdjustingId(item.id);
                          }}
                        >
                          <ArrowDownUp size={16} className="mr-1" />
                          Adjust
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
