import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MdAdd, MdEdit, MdDelete, MdCheckCircle, MdCancel } from "react-icons/md";
import PageHeader from "../../components/owner/PageHeader";
import Modal from "../../components/owner/Modal";
import { fetchMenu, createMenuItem, updateMenuItem, deleteMenuItem } from "../../services/ownerApi";
import { useOwnerRestaurant } from "../../context/OwnerRestaurantContext";

const EMPTY_FORM = {
    name: "", description: "", price: "", category: "",
    preparationTime: 15, isAvailable: true, image: ""
};

const AvailabilityBadge = ({ value }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        value ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
    }`}>
        {value ? <MdCheckCircle size={12} /> : <MdCancel size={12} />}
        {value ? "Available" : "Unavailable"}
    </span>
);

const CATEGORIES = ["Shawarma","Lassi","Juice","Coffee","Mojito","Ice Cream","Ice Tea","Thick Shake","Lemonades","Other"];

const MenuForm = ({ initial, onSubmit, loading }) => {
    const [form, setForm] = useState(initial ?? EMPTY_FORM);
    const [imgError, setImgError] = useState(false);

    const handle = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
        if (name === "image") setImgError(false);
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
            {/* Image preview */}
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <input name="image" value={form.image} onChange={handle} placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                {form.image && !imgError ? (
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 h-36 bg-gray-50">
                        <img src={form.image} alt="preview" onError={() => setImgError(true)}
                            className="w-full h-full object-cover" />
                    </div>
                ) : form.image && imgError ? (
                    <p className="mt-1 text-xs text-red-500">⚠️ Image URL could not be loaded</p>
                ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input name="name" value={form.name} onChange={handle} required placeholder="Mango Lassi"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                    <input name="price" type="number" min="0" step="1" value={form.price} onChange={handle} required placeholder="120"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select name="category" value={form.category} onChange={handle}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white">
                        <option value="">Select…</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prep Time (min)</label>
                    <input name="preparationTime" type="number" min="1" value={form.preparationTime} onChange={handle}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none" />
                </div>
                <div className="flex items-center gap-2 mt-5">
                    <input id="avail" name="isAvailable" type="checkbox" checked={form.isAvailable} onChange={handle}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-400" />
                    <label htmlFor="avail" className="text-sm text-gray-700">Available now</label>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea name="description" value={form.description} onChange={handle} rows={2} placeholder="Rich and creamy mango lassi..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none resize-none" />
                </div>
            </div>
            <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors disabled:opacity-60">
                {loading ? "Saving…" : "Save Item"}
            </button>
        </form>
    );
};

const OwnerMenu = () => {
    const { restaurant } = useOwnerRestaurant();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const load = () => {
        if (!restaurant?._id) { setLoading(false); return; }
        setLoading(true);
        fetchMenu(restaurant._id)
            .then(({ data }) => setItems(data.data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [restaurant]);

    const openAdd = () => { setEditItem(null); setModalOpen(true); };
    const openEdit = (item) => { setEditItem(item); setModalOpen(true); };

    const handleSubmit = async (form) => {
        setSaving(true);
        try {
            if (editItem) {
                const { data } = await updateMenuItem(editItem._id, form);
                setItems((prev) => prev.map((i) => (i._id === editItem._id ? data.data : i)));
            } else {
                const { data } = await createMenuItem({ ...form, restaurant: restaurant._id });
                setItems((prev) => [data.data, ...prev]);
            }
            setModalOpen(false);
        } catch (err) {
            alert(err?.response?.data?.message ?? "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this menu item?")) return;
        try {
            await deleteMenuItem(id);
            setItems((prev) => prev.filter((i) => i._id !== id));
        } catch (err) {
            alert(err?.response?.data?.message ?? "Failed to delete");
        }
    };

    const filtered = items.filter((i) =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.category?.toLowerCase().includes(search.toLowerCase())
    );

    const grouped = filtered.reduce((acc, item) => {
        const cat = item.category || "Uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <PageHeader
                title="Menu"
                description={`${items.length} item${items.length !== 1 ? "s" : ""}`}
                action={
                    <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors shadow-sm">
                        <MdAdd size={18} /> Add Item
                    </button>
                }
            />

            {/* Search */}
            <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or category…"
                className="w-full max-w-sm px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none bg-white shadow-sm"
            />

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">No menu items found. Add your first item!</p>
                </div>
            ) : (
                Object.entries(grouped).map(([category, catItems]) => (
                    <div key={category}>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {catItems.map((item, i) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {item.image && (
                                        <img src={item.image} alt={item.name} className="w-full h-36 object-cover" />
                                    )}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</p>
                                            <span className="font-bold text-orange-500 text-sm flex-shrink-0">₹{item.price}</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-1.5">
                                                <AvailabilityBadge value={item.isAvailable} />
                                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs border border-gray-200">
                                                    {item.preparationTime}m
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                                                    <MdEdit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                                    <MdDelete size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Menu Item" : "Add Menu Item"}>
                <MenuForm initial={editItem ? { ...editItem } : undefined} onSubmit={handleSubmit} loading={saving} />
            </Modal>
        </div>
    );
};

export default OwnerMenu;
