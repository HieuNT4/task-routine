"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useAppData } from "@/context/AppDataContext";
import { newId } from "@/lib/storage";
import { colors } from "@/theme/tokens";

interface ShoppingDialogProps {
  onClose: () => void;
}

export default function ShoppingDialog({ onClose }: ShoppingDialogProps) {
  const { shopping, updateShopping } = useAppData();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const remaining = shopping.filter((i) => !i.checked).length;

  const add = () => {
    if (!name.trim()) return;
    updateShopping([
      ...shopping,
      { id: newId(), name: name.trim(), quantity: quantity.trim() || undefined, checked: false },
    ]);
    setName("");
    setQuantity("");
  };

  return (
    <Dialog open onClose={onClose} fullScreen className="ShoppingDialog">
      <DialogTitle className="flex items-center justify-between" sx={{ pt: "calc(var(--safe-top) + 16px)" }}>
        <Box>
          <Typography variant="h2" component="span">
            Đi chợ 2 tuần
          </Typography>
          <Typography variant="body2" sx={{ color: colors.muted }}>
            Còn {remaining}/{shopping.length} món
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Đóng">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <TextField size="small" label="Món" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            size="small"
            label="SL"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            sx={{ maxWidth: 96 }}
          />
          <Button type="submit" variant="contained" disabled={!name.trim()}>
            Thêm
          </Button>
        </Box>

        <List disablePadding>
          {shopping.map((item) => (
            <ListItem
              key={item.id}
              disableGutters
              divider
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`Xoá ${item.name}`}
                  onClick={() => updateShopping(shopping.filter((i) => i.id !== item.id))}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: colors.muted }} />
                </IconButton>
              }
            >
              <Checkbox
                checked={item.checked}
                onChange={() =>
                  updateShopping(
                    shopping.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
                  )
                }
                inputProps={{ "aria-label": `Đã mua ${item.name}` }}
              />
              <ListItemText
                primary={item.name}
                secondary={item.quantity}
                slotProps={{
                  primary: {
                    sx: {
                      textDecoration: item.checked ? "line-through" : "none",
                      color: item.checked ? colors.muted : colors.ink,
                    },
                  },
                }}
              />
            </ListItem>
          ))}
        </List>

        <Button
          fullWidth
          variant="outlined"
          sx={{ mt: 3 }}
          onClick={() => updateShopping(shopping.map((i) => ({ ...i, checked: false })))}
        >
          Bỏ tick tất cả (tuần mới)
        </Button>
      </DialogContent>
    </Dialog>
  );
}
