(function () {
	'use strict';

	window.EditAsset = class EditAsset {
		constructor() {
			this.make_code_field_group();
			this.add_attachment_popover();
			// remove this once the pr related to code editor max lines is merged
			this.set_code_editor_height();
			this.render_preview();
			this.add_attachment_handler();
			this.set_listeners();
			this.create_comment_box();
			this.make_title_editable();
			this.render_sidebar_diff();
		}

		make_code_field_group() {
			this.code_field_group = new frappe.ui.FieldGroup({
				fields: [
					{
						fieldname: "type",
						fieldtype: "Select",
						default: "Markdown",
						options: "Markdown\nRich Text",
					},
					{
						fieldtype: "Column Break",
					},
					{
						fieldname: "attachment_controls",
						fieldtype: "HTML",
						options: this.get_attachment_controls_html(),
						depends_on: 'eval:doc.type=="Markdown"',
					},
					{
						fieldtype: "Section Break",
					},
					{
						fieldname: "code_html",
						fieldtype: "Text Editor",
						default: $(".wiki-content-html").html(),
						depends_on: 'eval:doc.type=="Rich Text"',
					},
					{
						fieldname: "code_md",
						fieldtype: "Code",
						options: "Markdown",
						wrap: true,
						max_lines: Infinity,
						min_lines: 20,
						default: $(".wiki-content-md").html().replaceAll('&gt;', '>'),
						depends_on: 'eval:doc.type=="Markdown"',
					} ],
				body: $(".wiki-write").get(0),
			});
			this.code_field_group.make();
			$(".wiki-write .form-section:last").removeClass("empty-section");
		}

		get_attachment_controls_html() {
			return ("\n\t\t\t<div class='attachment-controls '>\n\t\t\t\t<div class='show-attachments'>\n\t\t\t\t\t" + (this.get_show_uploads_svg()) + "\n\t\t\t\t\t\t<span class='number'>0</span>&nbsp;attachments\n\t\t\t\t</div>&nbsp;&nbsp;\n\t\t\t\t<div class='add-attachment-wiki'>\n\t\t\t\t\t<span class='btn'>\n\t\t\t\t\t" + (this.get_upload_image_svg()) + "\n\t\t\t\t\t\tUpload Attachment\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t");
		}

		get_show_uploads_svg() {
			return "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n\t\t\t<path d=\"M12.6004 6.68841L7.6414 11.5616C6.23259 12.946 3.8658 12.946 2.45699 11.5616C1.04819 10.1772\n\t\t\t1.04819 7.85132 2.45699 6.4669L6.85247 2.14749C7.86681 1.15071 9.44467 1.15071 10.459 2.14749C11.4733\n\t\t\t3.14428 11.4733 4.69483 10.459 5.69162L6.40165 9.62339C5.83813 10.1772 4.93649 10.1772 4.42932 9.62339C3.8658\n\t\t\t9.06962 3.8658 8.18359 4.42932 7.68519L7.81045 4.36257\" stroke=\"#2D95F0\" stroke-miterlimit=\"10\" stroke-linecap=\"round\"/>\n\t\t</svg>"
		}

		get_upload_image_svg() {
			return "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n\t\t\t<path d=\"M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899\n\t\t\t 4.41015 14.5 8 14.5Z\" stroke=\"#505A62\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n\t\t\t<path d=\"M8 4.75V11.1351\" stroke=\"#505A62\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n\t\t\t<path d=\"M5.29102 7.45833L7.99935 4.75L10.7077 7.45833\" stroke=\"#505A62\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" \n\t\t\tstroke-linejoin=\"round\"/>\n\t\t</svg>"

		}

		add_attachment_popover() {
			var this$1 = this;

			$(".show-attachments").popover({
				trigger: "click",
				placement: "bottom",

				content: function () {
					return this$1.build_attachment_table();
				},
				html: true,
			});
		}

		build_attachment_table() {
			var wrapper = $('<div class="wiki-attachment"></div>');
			wrapper.empty();

			var table = $(this.get_attachment_table_header_html()).appendTo(wrapper);
			if (!this.attachments || !this.attachments.length)
				{ return "No attachments uploaded"; }

			this.attachments.forEach(function (f) {
				var row = $("<tr></tr>").appendTo(table.find("tbody"));
				$(("<td>" + (f.file_name) + "</td>")).appendTo(row);
				$(("<td>\n\t\t\t<a class=\"btn btn-default btn-xs btn-primary-light text-nowrap copy-link\" data-link=\"![](" + (f.file_url) + ")\" data-name = \"" + (f.file_name) + "\" >\n\t\t\t\tCopy Link\n\t\t\t</a>\n\t\t\t</td>")).appendTo(row);
				$(("<td>\n\n\t\t\t<a class=\"btn btn-default btn-xs  center delete-button\"  data-name = \"" + (f.file_name) + "\" >\n\t\t\t<svg class=\"icon icon-sm\"><use xlink:href=\"#icon-delete\"></use></svg>\n\n\t\t\t</a>\n\t\t\t</td>")).appendTo(row);
			});
			return wrapper;
		}

		get_attachment_table_header_html() {
			return "<table class=\"table  attachment-table\" \">\n\t\t\t<tbody></tbody>\n\t\t</table>";
		}

		set_code_editor_height() {
			var this$1 = this;

			setTimeout(function () {
				// expand_code_editor
				var code_md = this$1.code_field_group.get_field("code_md");
				code_md.expanded = !this$1.expanded;
				code_md.refresh_height();
				code_md.toggle_label();
			}, 120);
		}

		raise_patch() {
			var side = {};

			var name = $(".doc-sidebar .web-sidebar").get(0).dataset.name;
			side[name] = [];
			var items = $($(".doc-sidebar .web-sidebar").get(0))
				.children(".sidebar-items")
				.children("ul")
				.not(".hidden")
				.children("li");
			items.each(function (item) {
				if (!items[item].dataset.name) { return; }
				side[name].push({
					name: items[item].dataset.name,
					type: items[item].dataset.type,
					new: items[item].dataset.new,
					title: items[item].dataset.title,
					group_name: items[item].dataset.groupName,
				});
			});

			$('.doc-sidebar [data-type="Wiki Sidebar"]').each(function () {
				var name = $(this).get(0).dataset.groupName;
				side[name] = [];
				var items = $(this).children("ul").children("li");
				items.each(function (item) {
					if (!items[item].dataset.name) { return; }
					side[name].push({
						name: items[item].dataset.name,
						type: items[item].dataset.type,
						new: items[item].dataset.new,
						title: items[item].dataset.title,
						group_name: items[item].dataset.groupName,
					});
				});
			});

			var me = this;
			var dfs = [];
			var title_of_page = $('.edit-title span').text();
			dfs.push(
				{
					fieldname: "edit_message",
					fieldtype: "Text",
					label: "Message",
					default: $('[name="new"]').val()
						? ("Add new page: " + title_of_page)
						: ("Edited " + title_of_page),
					mandatory: 1,
				},
				{
					fieldname: "sidebar_edited",
					fieldtype: "Check",
					label: "I updated the sidebar",
					default: $('[name="new"]').val() ? 1 : 0,
				}
			);

			var dialog = new frappe.ui.Dialog({
				fields: dfs,
				title: __("Please describe your changes"),
				primary_action_label: __("Submit Changes"),
				primary_action: function () {
					frappe.call({
						method: "wiki.wiki.doctype.wiki_page.wiki_page.update",
						args: {
							name: $('[name="wiki_page"]').val(),
							wiki_page_patch: $('[name="wiki_page_patch"]').val(),
							message: this.get_value("edit_message"),
							sidebar_edited: this.get_value("sidebar_edited"),
							content: me.content,
							type: me.code_field_group.get_value("type"),
							attachments: me.attachments,
							new: $('[name="new"]').val(),
							title: $('.edit-title span').text(),
							new_sidebar: $(".doc-sidebar").get(0).innerHTML,
							new_sidebar_items: side,
						},
						callback: function (r) {
							if (!r.message.approved) {
								frappe.msgprint({
									message:
										"A Change Request has been created. You can track your requests on the contributions page",
									indicator: "green",
									title: "Change Request Created",
									alert: 1
								});
							}

							// route back to the main page
							window.location.href = '/' + r.message.route;
						},
						freeze: true,
					});
					dialog.hide();
					$("#freeze").addClass("show");
				},
			});
			dialog.show();
		}

		render_preview() {
			var this$1 = this;

			$('a[data-toggle="tab"]').on("click", function (e) {
				var activeTab = $(e.target);

				if (
					activeTab.prop("id") === "preview-tab" ||
					activeTab.prop("id") === "diff-tab"
				) {
					var $preview = $(".wiki-preview");
					var $diff = $(".wiki-diff");
					var type = this$1.code_field_group.get_value("type");
					var content = "";
					if (type == "Markdown") {
						content = this$1.code_field_group.get_value("code_md");
					} else {
						content = this$1.code_field_group.get_value("code_html");
						var turndownService = new TurndownService();
						turndownService = turndownService.keep(["div class", "iframe"]);
						content = turndownService.turndown(content);
					}
					if (!content) {
						this$1.set_empty_message($preview, $diff);
						return;
					}
					this$1.set_loading_message($preview, $diff);

					frappe.call({
						method: "wiki.wiki.doctype.wiki_page.wiki_page.preview",
						args: {
							content: content,
							type: type,
							path: this$1.route,
							name: $('[name="wiki_page"]').val(),
							attachments: this$1.attachments,
							new: $('[name="new"]').val(),
						},
						callback: function (r) {
							if (r.message) {
								$preview.html(r.message.html);
								if (!$('[name="new"]').val()) {
									var empty_diff = "<div class=\"text-muted center\"> No Changes made</div>";
									var diff_html = $(r.message.diff).find('.insert, .delete').length?r.message.diff:empty_diff;
									$diff.html(diff_html);
								}
							}
						},
					});
				}
			});
		}

		set_empty_message($preview, $diff) {
			$preview.html("<div>Please add some code</div>");
			$diff.html("<div>Please add some code</div>");
		}

		set_loading_message($preview, $diff) {
			$preview.html("Loading preview...");
			$diff.html("Loading diff...");
		}

		add_attachment_handler() {
			var me = this;
			$(".add-attachment-wiki").click(function () {
				me.new_attachment();
			});
			$(".submit-wiki-page").click(function () {
				me.get_markdown();
			});

			$(".approve-wiki-page").click(function () {
				me.approve_wiki_page();
			});
		}

		new_attachment() {
			var this$1 = this;

			if (this.dialog) {
				// remove upload dialog
				this.dialog.$wrapper.remove();
			}

			new frappe.ui.FileUploader({
				folder: "Home/Attachments",
				on_success: function (file_doc) {
					if (!this$1.attachments) { this$1.attachments = []; }
					if (!this$1.save_paths) { this$1.save_paths = {}; }
					this$1.attachments.push(file_doc);
					$(".wiki-attachment").empty().append(this$1.build_attachment_table());
					$(".attachment-controls").find(".number").text(this$1.attachments.length);
				},
			});
		}

		get_markdown() {
			var me = this;

			if (me.code_field_group.get_value("type") == "Markdown") {
				this.content = me.code_field_group.get_value("code_md");
				this.raise_patch();
			} else {
				this.content = this.code_field_group.get_value("code_html");

				frappe.call({
					method:
						"wiki.wiki.doctype.wiki_page.wiki_page.extract_images_from_html",
					args: {
						content: this.content,
					},
					callback: function (r) {
						if (r.message) {
							me.content = r.message;
							var turndownService = new TurndownService();
							turndownService = turndownService.keep(["div class", "iframe"]);
							me.content = turndownService.turndown(me.content);
							me.raise_patch();
						}
					},
				});
			}
		}

		set_listeners() {
			var me = this;

			$("body").on("click", ".copy-link", function () {
				frappe.utils.copy_to_clipboard($(this).attr("data-link"));
			});

			$("body").on("click", ".delete-button", function () {
				var this$1 = this;

				frappe.confirm(
					("Are you sure you want to delete the file \"" + ($(this).attr(
						"data-name"
					)) + "\""),
					function () {
						me.attachments.forEach(function (f, index, object) {
							if (f.file_name == $(this$1).attr("data-name")) {
								object.splice(index, 1);
							}
						});
						$(".wiki-attachment").empty().append(me.build_attachment_table());
						$(".attachment-controls").find(".number").text(me.attachments.length);
					}
				);
			});
		}

		create_comment_box() {
			var this$1 = this;

			this.comment_box = frappe.ui.form.make_control({
				parent: $(".comment-box"),
				df: {
					fieldname: "new_comment",
					fieldtype: "Comment",
				},
				enable_mentions: false,
				render_input: true,
				only_input: true,
				on_submit: function (comment) {
					this$1.add_comment_to_patch(comment);
				},
			});
		}

		add_comment_to_patch(comment) {
			var this$1 = this;

			if (strip_html(comment).trim() != "") {
				this.comment_box.disable();

				frappe.call({
					method:
						"wiki.wiki.doctype.wiki_page_patch.wiki_page_patch.add_comment_to_patch",
					args: {
						reference_name: $('[name="wiki_page_patch"]').val(),
						content: comment,
						comment_email: frappe.session.user,
						comment_by: frappe.session.user_fullname,
					},
					callback: function (r) {
						comment = r.message;

						this$1.display_new_comment(comment, this$1.comment_box);
					},
					always: function () {
						this$1.comment_box.enable();
					},
				});
			}
		}

		display_new_comment(comment, comment_box) {
			if (comment) {
				comment_box.set_value("");

				var new_comment = this.get_comment_html(
					comment.owner,
					comment.creation,
					comment.timepassed,
					comment.content
				);

				$(".timeline-items").prepend(new_comment);
			}
		}

		get_comment_html(owner, creation, timepassed, content) {
			return $(("\n\t\t\t<div class=\"timeline-item\">\n\t\t\t\t<div class=\"timeline-badge\">\n\t\t\t\t\t<svg class=\"icon icon-md\">\n\t\t\t\t\t\t<use href=\"#icon-small-message\"></use>\n\t\t\t\t\t</svg>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"timeline-content frappe-card\">\n\t\t\t\t\t<div class=\"timeline-message-box\">\n\t\t\t\t\t\t<span class=\"flex justify-between\">\n\t\t\t\t\t\t\t<span class=\"text-color flex\">\n\t\t\t\t\t\t\t\t<span>\n\t\t\t\t\t\t\t\t\t" + owner + "\n\t\t\t\t\t\t\t\t\t<span class=\"text-muted margin-left\">\n\t\t\t\t\t\t\t\t\t\t<span class=\"frappe-timestamp \"\n\t\t\t\t\t\t\t\t\t\t\tdata-timestamp=\"" + creation + "\"\n\t\t\t\t\t\t\t\t\t\t\ttitle=\"" + creation + "\">" + timepassed + "</span>\n\t\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t</span>\n\t\t\t\t\t\t<div class=\"content\">\n\t\t\t\t\t\t\t" + content + "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"));
		}

		make_title_editable() {
			var title_span = $(".edit-title>span");
			var title_handle = $(".edit-title>i");
			var title_input = $(".edit-title>input");
			title_handle.click(function () {
				title_span.addClass("hide");
				title_handle.addClass("hide");
				title_input.removeClass("hide");
				title_input.val(title_span.text());
				title_input.focus();
			});
			title_input.focusout(function () {
				title_span.removeClass("hide");
				title_handle.removeClass("hide");
				title_input.addClass("hide");
				title_span.text(title_input.val());
			});
		}

		approve_wiki_page() {
			frappe.call({
				method: "wiki.wiki.doctype.wiki_page.wiki_page.approve",
				args: {
					wiki_page_patch: $('[name="wiki_page_patch"]').val(),
				},
				callback: function () {
					frappe.msgprint({
						message:
							"The Change has been approved.",
						indicator: "green",
						title: "Approved",
					});
					window.location.href = '/' + $('[name="wiki_page"]').val();
				},
				freeze: true,
			});

		}

		render_sidebar_diff() {
			var lis = $(".sidebar-diff");
			var sidebar_items = JSON.parse($('[name="new_sidebar_items"]').val());
			lis.empty();
			for (var sidebar in sidebar_items) {
				for (var item in sidebar_items[sidebar]) {
					var class_name = ("." + sidebar).replaceAll("/", "\\/");
					var target = lis.find(class_name);
					if (!target.length) {
						target = $(".sidebar-diff");
					}
					if (sidebar_items[sidebar][item].type == "Wiki Sidebar") {
						$(target).append(
							"<li>" +
								sidebar_items[sidebar][item].title +
								"</li>" +
								"<ul class=" +
								sidebar_items[sidebar][item].group_name +
								"></ul>"
						);
					} else {
						$(target).append(
							"<li class=" +
								sidebar_items[sidebar][item].group_name +
								">" +
								sidebar_items[sidebar][item].title +
								"</li>"
						);
					}
				}
			}
		}
	};

	window.Wiki = class Wiki {
		activate_sidebars() {
			$(".sidebar-item").each(function (index) {
				var active_class = "active";
				var page_href = window.location.pathname;
				if (page_href.indexOf("#") !== -1) {
					page_href = page_href.slice(0, page_href.indexOf("#"));
				}
				if ($(this).data("route") == page_href) {
					$(this).addClass(active_class);
					$(this).find("a").addClass(active_class);
				}
			});
			// scroll the active sidebar item into view
			var active_sidebar_item = $(".sidebar-item.active");
			if (active_sidebar_item.length > 0) {
				active_sidebar_item.get(1).scrollIntoView(true, {
					behavior: "smooth",
					block: "nearest",
				});
			}
		}

		toggle_sidebar(event) {
			$(event.currentTarget).parent().children("ul").toggleClass("hidden");
			$(event.currentTarget).find(".drop-icon").toggleClass("hidden");
			$(event.currentTarget).find(".drop-left").toggleClass("hidden");
			event.stopPropagation();
		}

		set_active_sidebar() {
			$(".doc-sidebar,.web-sidebar").on(
				"click",
				".collapsible",
				this.toggle_sidebar
			);
			$(".sidebar-group").children("ul").addClass("hidden");
			$(".sidebar-item.active")
				.parents(" .web-sidebar .sidebar-group>ul")
				.removeClass("hidden");
			var sidebar_groups = $(".sidebar-item.active").parents(
				".web-sidebar .sidebar-group"
			);
			sidebar_groups.each(function () {
				$(this).children(".collapsible").find(".drop-left").addClass("hidden");
			});
			sidebar_groups.each(function () {
				$(this).children(".collapsible").find(".drop-icon").removeClass("hidden");
			});
		}
	};

	window.EditWiki = class EditWiki extends Wiki {
		constructor() {
			var this$1 = this;

			super();
			frappe.provide("frappe.ui.keys");
			$("document").ready(function () {
				frappe
					.call("wiki.wiki.doctype.wiki_page.wiki_page.get_sidebar_for_page", {
						wiki_page: $('[name="wiki_page"]').val(),
					})
					.then(function (result) {
						$(".doc-sidebar").empty().append(result.message);
						this$1.activate_sidebars();
						this$1.set_active_sidebar();
						this$1.set_empty_ul();
						this$1.set_sortable();
						this$1.set_add_item();
						if ($('[name="new"]').first().val()) {
							this$1.add_new_link();
						}
					});
			});
		}

		activate_sidebars() {
			$(".sidebar-item").each(function (index) {
				var active_class = "active";
				var page_href = window.location.pathname;
				if (page_href.indexOf("#") !== -1) {
					page_href = page_href.slice(0, page_href.indexOf("#"));
				}
				if (page_href.split('/').slice(0,-1).join('/')== $(this).data("route")) {
					$(this).addClass(active_class);
					$(this).find("a").addClass(active_class);
				}
			});
			// scroll the active sidebar item into view
			var active_sidebar_item = $(".sidebar-item.active");
			if (active_sidebar_item.length > 0) {
				active_sidebar_item.get(0).scrollIntoView(true, {
					behavior: "smooth",
					block: "nearest",
				});
			}
		}

		set_empty_ul() {
			$(".collapsible").each(function () {
				if ($(this).parent().find("ul").length == 0) {
					$(this)
						.parent()
						.append(
							$("<ul class=\"list-unstyled hidden\" style=\"min-height:20px;\"> </ul")
						);
				}
			});
		}

		set_sortable() {
			$(".web-sidebar ul").each(function () {
				new Sortable(this, {
					group: {
						name: "qux",
						put: ["qux"],
						pull: ["qux"],
					},
				});
			});
		}

		set_add_item() {
			$("<div class=\"text-muted add-sidebar-item\">+ Add Item</div>").appendTo(
				$(".web-sidebar")
			);
			var me = this;
			$(".add-sidebar-item").click(function () {
				var dfs = me.get_add_new_item_dialog_fields();

				var dialog = new frappe.ui.Dialog({
					title: "Add Components to Sidebar",
					fields: dfs,
					primary_action: function (fields) {
						if (fields.type == "Add Wiki Page") {
							me.add_wiki_page(fields);
						} else {
							me.add_wiki_sidebar(fields);
						}
						dialog.hide();
					},
				});
				dialog.show();
			});
		}

		get_add_new_item_dialog_fields() {
			return [
				{
					fieldname: "type",
					label: "Add Type",
					fieldtype: "Autocomplete",
					options: ["Add Wiki Page", "New Wiki Sidebar"],
				},
				{
					fieldname: "wiki_page",
					label: "Wiki Page",
					fieldtype: "Link",
					options: "Wiki Page",
					depends_on: "eval: doc.type=='Add Wiki Page'",
					mandatory_depends_on: "eval: doc.type=='Add Wiki Page'",
				},
				{
					fieldname: "route",
					label: "Name",
					fieldtype: "Data",
					depends_on: "eval: doc.type=='New Wiki Sidebar'",
					mandatory_depends_on: "eval: doc.type=='New Wiki Sidebar'",
				},
				{
					fieldname: "title",
					label: "Title",
					fieldtype: "Data",
					depends_on: "eval: doc.type=='New Wiki Sidebar'",
					mandatory_depends_on: "eval: doc.type=='New Wiki Sidebar'",
				} ];
		}

		add_wiki_page(fields) {
			var me = this;
			frappe.call({
				method: "frappe.client.get_value",
				args: {
					doctype: "Wiki Page",
					fieldname: "title",
					filters: fields.wiki_page,
				},
				callback: function (r) {
					var $new_page = me.get_new_page_html(r, fields);

					$new_page.appendTo(
						$(".doc-sidebar .sidebar-items")
							.children(".list-unstyled")
							.not(".hidden")
							.first()
					);
				},
			});
		}

		get_new_page_html(r, fields) {
			return $(("\n\t\t<li class=\"sidebar-item\" data-type=\"Wiki Page\"\n\t\t\tdata-name=\"" + (fields.wiki_page) + "\" data-new=1 >\n\t\t\t<div>\n\t\t\t\t<div>\n\t\t\t\t\t<a href=\"#\" class=\"green\" >\n\t\t\t\t\t\t\t" + (r.message.title) + "\n\t\t\t\t\t</a>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</li>\n\t\t"));
		}

		add_wiki_sidebar(fields) {
			var $new_page = this.get_wiki_sidebar_html(fields);

			$new_page.appendTo(
				$(".doc-sidebar .sidebar-items")
					.children(".list-unstyled")
					.not(".hidden")
					.first()
			);

			$(".web-sidebar ul").each(function () {
				new Sortable(this, {
					group: {
						name: "qux",
						put: ["qux"],
						pull: ["qux"],
					},
				});
			});
		}

		get_wiki_sidebar_html(fields) {
			return $(("\n\t\t\t<li class=\"sidebar-group\" data-type=\"Wiki Sidebar\"\n\t\t\t\tdata-name=\"new-sidebar\" data-group-name=\"" + (fields.route) + "\"\n\t\t\t\tdata-new=1 data-title=\"" + (fields.title) + "\" draggable=\"false\">\n\n\t\t\t\t<div class=\"collapsible\">\n\t\t\t\t\t<span class=\"drop-icon hidden\">\n\t\t\t\t\t\t\t<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\"\n\t\t\t\t\t\t\t\txmlns=\"http://www.w3.org/2000/svg\">\n\t\t\t\t\t\t\t\t<path d=\"M8 10L12 14L16 10\" stroke=\"#4C5A67\"\n\t\t\t\t\t\t\t\tstroke-miterlimit=\"10\" stroke-linecap=\"round\"\n\t\t\t\t\t\t\t\tstroke-linejoin=\"round\"></path>\n\t\t\t\t\t\t\t</svg>\n\t\t\t\t\t</span>\n\n\t\t\t\t\t<span class=\"drop-left\">\n\t\t\t\t\t\t\t<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"\n\t\t\t\t\t\t\t\tfill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n\t\t\t\t\t\t\t\t<path d=\"M10 16L14 12L10 8\" stroke=\"#4C5A67\"\n\t\t\t\t\t\t\t\tstroke-linecap=\"round\" stroke-linejoin=\"round\"></path>\n\t\t\t\t\t\t\t</svg>\n\t\t\t\t\t</span>\n\t\t\t\t\t<span class=\"h6\">" + (fields.title) + "</span>\n\t\t\t\t\t</div>\n\t\t\t\t\t<ul class=\"list-unstyled hidden\" style=\"min-height:20px;\"> </ul>\n\t\t\t</li>\n\t\t\t"));
		}

		add_new_link() {
			var $new_page = $("\n\t\t\t<li class=\"sidebar-item\" data-type=\"Wiki Page\" data-name=\"new-wiki-page\" data-new=1 ><div>\n\t\t\t\t\t<div>\n\t\t\t\t\t\t\t<a href=\"#\" class=\"green\">New Wiki Page</a>\n\t\t\t\t\t</div></div>\n\t\t\t\t\t</li>\n\t\t");

			$new_page.appendTo(
				$(".doc-sidebar .sidebar-items")
					.children(".list-unstyled")
					.not(".hidden")
					.first()
			);
		}
	};

	window.RenderWiki = class RenderWiki extends Wiki {
		constructor(opts) {
			var this$1 = this;

			super();
			$("document").ready(function () {
				if (
					window.location.pathname != "/revisions" &&
					window.location.pathname != "/compare"
				) {
					this$1.activate_sidebars();
					this$1.set_active_sidebar();
					this$1.set_nav_buttons();
					this$1.set_toc_highlighter();
				}
			});
		}

		set_toc_highlighter() {
			$(document).ready(function () {
				$(window).scroll(function () {
					if (currentAnchor().not('.no-underline').hasClass("active")) { return }
					$(".page-toc a").removeClass("active");
					currentAnchor().addClass("active");
				});
			});

			function tocItem(anchor) {
				return $('[href="' + anchor + '"]');
			}

			function heading(anchor) {
				return $("[id=" + anchor.substr(1) + "]");
			}

			var _anchors = null;
			function anchors() {
				if (!_anchors) {
					_anchors = $(".page-toc a").map(function () {
						return $(this).attr("href");
					});
				}
				return _anchors;
			}

			function currentAnchor() {
				var winY = window.pageYOffset;
				var currAnchor = null;
				anchors().each(function () {
					var y = heading(this).position().top;
					if (y < winY + window.innerHeight * 0.23) {
						currAnchor = this;
						return;
					}
				});
				return tocItem(currAnchor);
			}
		}

		set_nav_buttons() {
			var current_index = -1;

			$(".sidebar-column")
				.find("a")
				.each(function (index) {
					if ($(this).attr("class")) {
						var dish = $(this).attr("class").split(/\s+/)[0];
						if (dish === "active") {
							current_index = index;
						}
					}
				});

			if (current_index != 0) {
				$(".btn.left")[0].href =
					$(".sidebar-column").find("a")[current_index - 1].href;
				$(".btn.left")[0].innerHTML =
					"←" + $(".sidebar-column").find("a")[current_index - 1].innerHTML;
			} else {
				$(".btn.left").hide();
			}

			if (current_index < $(".sidebar-column").find("a").length - 1) {
				$(".btn.right")[0].href =
					$(".sidebar-column").find("a")[current_index + 1].href;
				$(".btn.right")[0].innerHTML =
					$(".sidebar-column").find("a")[current_index + 1].innerHTML + "→";
			} else {
				$(".btn.right").hide();
			}
		}
	};

}());
//# sourceMappingURL=wiki.bundle.js.map
