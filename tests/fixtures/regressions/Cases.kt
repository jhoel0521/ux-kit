@Composable
fun Cases(vm: Vm) {
  IconButton(onClick = { vm.delete(id) }) { Icon(Icons.Default.Delete, contentDescription = null) }
  Image(painter, "Open", modifier = Modifier.size(32.dp).clickable { open() })
}
